/**
 * src/initState.js
 *
 * Script para reiniciar o state.json e definir a data de corte (lastRunAt) como o momento atual.
 * Isso faz com que o serviço ignore todos os registros antigos e processe somente novidades a partir de agora.
 *
 * Uso:
 *   node src/initState.js
 */

const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de estado
const STATE_FILE = path.resolve(__dirname, '../state.json');

// Cria o objeto inicial com lastRunAt = agora
const state = {
  lastRunAt: new Date().toISOString()
};

try {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  console.log(`✅ state.json redefinido com data de corte: ${state.lastRunAt}`);
} catch (err) {
  console.error('❌ Falha ao inicializar state.json:', err.message);
  process.exit(1);
}
