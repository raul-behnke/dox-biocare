// runOnce.js
require('dotenv').config();
const runCycle = require('./src/runCycle');

(async () => {
  try {
    console.log('▶️ Iniciando runCycle manual...');
    await runCycle();
    console.log('✅ runCycle concluído com sucesso');
  } catch (err) {
    console.error('❌ Erro no runCycle:', err);
  }
})();
