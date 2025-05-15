// src/testFetchUsers.js
const mc = require('./db/mysqlClient');

(async () => {
  try {
    const rows = await mc.fetchNewOrUpdated(null);
    const users = rows.filter(r => r.source_table === 'users');
    console.log(`Total de usuários encontrados: ${users.length}`);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
  }
})();
