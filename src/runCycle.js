const stateStore    = require('./store/stateStore');
const mysqlClient   = require('./db/mysqlClient');
const eventDetector = require('./detectors/eventDetector');
const webhook       = require('./dispatcher/webhook');

/**
 * Executa um ciclo de:
 * 1. Buscar todos os usuários completos e cadastros via orders_buyer
 * 2. Buscar carrinhos pendentes >3 minutos
 * 3. Detectar eventos (userCreated, cartAbandoned)
 * 4. Enviar webhooks
 * 5. Marcar registros processados
 * 6. Atualizar lastRunAt
 */
async function runCycle() {
  // 1. Checkpoint
  const lastRunAt = stateStore.getLastRunAt();
  console.log('🔄 runCycle, lastRunAt =', lastRunAt);

  // 2. Buscar todos os registros unificados (ignora data para users)
  let allRows = [];
  try {
    allRows = await mysqlClient.fetchNewOrUpdated(null);
  } catch (err) {
    console.error('❌ Erro em fetchNewOrUpdated(null):', err);
  }

  // Filtrar usuários completos não processados
  const userRows = allRows.filter(r =>
    r.source_table === 'users' && r.name && r.email && r.phone
  );
  console.log(`📥 encontrados ${userRows.length} usuários completos em 'users' (todos)`);

  const userRecords = userRows.filter(r =>
    !stateStore.get('users', r.id).processed
  );
  console.log(`📥 ${userRecords.length} usuários novos para processar`);

  // Filtrar cadastros via orders_buyer após lastRunAt e não processados
  const buyerRows = allRows.filter(r =>
    r.source_table === 'orders_buyer' &&
    (new Date(r.created_at) > lastRunAt || new Date(r.updated_at) > lastRunAt)
  );
  console.log(`📥 encontrados ${buyerRows.length} cadastros via 'orders_buyer'`);

  const buyerRecords = buyerRows.filter(r =>
    !stateStore.get('orders_buyer', r.id).processed
  );
  console.log(`📥 ${buyerRecords.length} cadastros via 'orders_buyer' novos`);

  // 3. Buscar carrinhos abandonados (>3m)
  let staleCarts = [];
  try {
    const rows = await mysqlClient.fetchStaleCarts();
    staleCarts = rows.filter(r => !stateStore.get('orders', r.id).processed);
    console.log(`📥 encontrados ${staleCarts.length} carrinhos abandonados (>3m) para processar`);
  } catch (err) {
    console.error('❌ Erro em fetchStaleCarts:', err);
  }

  // 4. Concatenação de registros para detecção
  const records = [...userRecords, ...buyerRecords, ...staleCarts];
  console.log(`📋 processando ${records.length} registros para detectar eventos`);

  // 5. Detectar eventos
  const events = eventDetector.detectEvents(records, stateStore);
  console.log(`🚀 ${events.length} eventos detectados:`, events.map(e => e.type));

  // 6. Enviar webhooks e marcar processados
  for (const ev of events) {
    try {
      await webhook.sendToGHL(ev);
      stateStore.markProcessed(
        ev.payload.source_table,
        ev.payload.record_id || ev.payload.id,
        ev.payload.status_id ?? null
      );
      console.log(`✅ Evento ${ev.type} processado para ${ev.payload.source_table}:${ev.payload.record_id || ev.payload.id}`);
    } catch (err) {
      console.error('❌ Erro ao despachar evento', ev.type, err);
    }
  }

  // 7. Atualizar lastRunAt
  stateStore.setLastRunAt(new Date());
  console.log('✅ Ciclo concluído em', new Date());
}

module.exports = runCycle;