/**
 * src/testIntegration.js
 *
 * Script de leitura apenas (SELECT) no banco real de produção ou homologação,
 * sem modificar dados ou marcar registros. Gera logs de eventos
 * userCreated e cartAbandoned no console e simula envio de webhooks.
 *
 * Uso: node src/testIntegration.js
 * Certifique-se de configurar seu .env com as credenciais DB e GHL_WEBHOOK_URL.
 */

require('dotenv').config();
const mysqlClient   = require('./db/mysqlClient');
const eventDetector = require('./detectors/eventDetector');
const { sendToGHL } = require('./dispatcher/webhook');

// Estado em memória: não persiste nada em disco
const stateStub = {
  get:           () => ({}),
  getLastRunAt:  () => null,
  markProcessed: () => {},
  setLastRunAt:  () => {}
};

(async () => {
  try {
    console.log('🔍 Iniciando leitura de usuários completos');
    const rows = await mysqlClient.fetchNewOrUpdated(null);
    const users = rows.filter(r => r.source_table === 'users' && r.name && r.email && r.phone);
    console.log(`📥 Encontrados ${users.length} usuários completos`);

    const userEvents = eventDetector.detectEvents(users, stateStub)
      .filter(e => e.type === 'userCreated');
    console.log(`🚀 Eventos userCreated detectados: ${userEvents.length}`);
    userEvents.forEach(ev => {
      console.log(`  • [userCreated] id=${ev.payload.id} name=${ev.payload.name}`);
    });

    console.log('\n🔍 Iniciando leitura de carrinhos pendentes >2h');
    const carts = await mysqlClient.fetchStaleCarts();
    console.log(`📥 Encontrados ${carts.length} carrinhos abandonados (>2h)`);

    const cartEvents = eventDetector.detectEvents(carts, stateStub)
      .filter(e => e.type === 'cartAbandoned');
    console.log(`🚀 Eventos cartAbandoned detectados: ${cartEvents.length}`);
    cartEvents.forEach(ev => {
      console.log(`  • [cartAbandoned] orderId=${ev.payload.order_id} createdAt=${ev.payload.created_at}`);
    });

    // Simular envio de webhooks
    const allEvents = [...userEvents, ...cartEvents];
    for (const ev of allEvents) {
      try {
        console.log(`📤 Simulando envio de ${ev.type} para GHL...`);
        const resp = await sendToGHL(ev);
        console.log('✅ Resposta GHL:', resp);
      } catch (err) {
        console.error('❌ Erro ao enviar webhook de', ev.type, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Erro no teste de integração (leitura + webhook):', err);
  } finally {
    process.exit(0);
  }
})();
