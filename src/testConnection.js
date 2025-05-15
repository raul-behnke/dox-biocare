const mysql = require('mysql2/promise');
const config = require('./config');

(async () => {
  console.log('🔍 Configuração carregada:', config);

  try {
    const conn = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    });
    console.log('✅ Conexão com o MySQL bem-sucedida!');
    await conn.end();
  } catch (err) {
    console.error('❌ Falha ao conectar ao MySQL:', err.message);
    process.exit(1);
  }
})();
