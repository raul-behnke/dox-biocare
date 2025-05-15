const cron = require('node-cron');
const runCycle = require('./runCycle');

/**
 * Inicia o agendamento do runCycle
 * - Intervalo de produção: a cada 30 segundos
 */
function start() {
  console.log('⏱️ Scheduler ativado: rodando runCycle() a cada 30s');
  cron.schedule('*/30 * * * * *', async () => {
    console.log('⏳ Disparando runCycle no cron');
    try {
      await runCycle();
    } catch (err) {
      console.error('Erro no ciclo agendado:', err);
    }
  });
}

module.exports = { start };
