// src/bootstrapState.js
require('dotenv').config();
const mysqlClient = require('./db/mysqlClient');
const stateStore  = require('./store/stateStore');
const STATUS      = require('./detectors/statusCodes');

(async () => {
  console.log('🚀 Bootstrap do state.json iniciado…');

  // Inicializa lastRunAt para agora (vai ignorar tudo antes deste timestamp)
  stateStore.setLastRunAt(new Date());

  // Marcar todos os usuários completos como processados
  const rows = await mysqlClient.fetchNewOrUpdated(null);
  for (const r of rows) {
    if (r.source_table === 'users') {
      const hasComplete = r.name && r.email && r.phone;
      if (hasComplete) {
        stateStore.markProcessed('users', r.id);
      }
    }
    // Marcar todos os pedidos pendentes >2h como processados
    else if (r.source_table === 'orders') {
      const createdAt  = new Date(r.created_at);
      const cutoffDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      if (r.status_id === STATUS.AWAITING_PAYMENT && createdAt <= cutoffDate) {
        stateStore.markProcessed('orders', r.id, r.status_id);
      }
    }
  }

  console.log('✅ Bootstrap concluído. Agora state.json ignora tudo até aqui.');
  process.exit(0);
})();
