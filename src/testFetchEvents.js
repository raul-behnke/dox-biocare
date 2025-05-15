// src/testFetchEvents.js
// Teste para detectar apenas userCreated

const mc = require('./db/mysqlClient');
const eventDetector = require('./detectors/eventDetector');
const stateStore = require('./store/stateStore');

(async () => {
  try {
    // Zera checkpoint para testar todos os usuários
    stateStore.setLastRunAt(new Date(0));
    console.log('🔄 Checkpoint resetado para:', stateStore.getLastRunAt());

    // Busca todos os registros novos ou atualizados
    const rows = await mc.fetchNewOrUpdated(stateStore.getLastRunAt());
    // Filtra apenas users completos
    const users = rows.filter(r => r.source_table === 'users' && r.name && r.email && r.phone);
    console.log(`📥 Usuários completos encontrados: ${users.length}`);

    // Detecta eventos userCreated
    const events = eventDetector.detectEvents(users, stateStore);
    const userCreatedEvents = events.filter(e => e.type === 'userCreated');
    console.log(`🚀 Eventos userCreated detectados: ${userCreatedEvents.length}`);

    // Detalhes dos eventos
    userCreatedEvents.forEach(ev => {
      console.log(`  • userCreated -> id: ${ev.payload.id}, nome: ${ev.payload.name}, email: ${ev.payload.email}`);
    });
  } catch (err) {
    console.error('❌ Erro no teste de eventos:', err);
  }
})();
