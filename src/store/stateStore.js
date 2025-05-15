const fs   = require('fs');
const path = require('path');
const FILE = path.resolve(__dirname, '../../state.json');

let state = {};

/**
 * Carrega o JSON em memória (chamada única).
 */
function load() {
  if (Object.keys(state).length === 0) {
    try {
      state = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
      state = {};
    }
  }
}

/**
 * Persiste o JSON na disco.
 */
function save() {
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

/**
 * Retorna a última data de execução como Date, ou null.
 */
function getLastRunAt() {
  load();
  return state.lastRunAt ? new Date(state.lastRunAt) : null;
}

/**
 * Atualiza lastRunAt.
 */
function setLastRunAt(date) {
  load();
  state.lastRunAt = date.toISOString();
  save();
}

/**
 * Recupera o meta de um registro (pode ter lastStatus e processed).
 */
function get(table, id) {
  load();
  state[table] = state[table] || {};
  return state[table][id] || {};
}

/**
 * Marca que o registro foi processado, e guarda lastStatus.
 */
function markProcessed(table, id, lastStatus = null) {
  load();
  state[table] = state[table] || {};
  state[table][id] = {
    ...state[table][id],
    processed: true,
    lastStatus,
  };
  save();
}

module.exports = {
  getLastRunAt,
  setLastRunAt,
  get,
  markProcessed,
};
