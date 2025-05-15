const scheduler = require('./scheduler');

(async () => {
  console.log('🚀 Iniciando automação DOX Biocare (modo cron)');
  console.log('⏱️ Agendando runCycle() a cada 30s');
  scheduler.start();
})();
