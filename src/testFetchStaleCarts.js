// src/testFetchStaleCarts.js
// Teste para fetchStaleCarts: pedeidos pendentes > 2 horas

const mc = require('./db/mysqlClient');

(async () => {
  try {
    // Chama fetchStaleCarts
    const rows = await mc.fetchStaleCarts();
    console.log(`📥 Carrinhos abandonados (>2h) encontrados: ${rows.length}`);

    // Validação básica das datas
    const now = Date.now();
    let validCount = 0;
    rows.forEach(r => {
      const createdAt = new Date(r.created_at).getTime();
      if (createdAt <= now - 2 * 60 * 60 * 1000) validCount++;
      else console.warn(`⚠️ Pedido ${r.id} com created_at recente: ${r.created_at}`);
    });
    console.log(`✅ ${validCount}/${rows.length} registros válidos (created_at <= NOW() - 2h)`);
  } catch (err) {
    console.error('❌ Erro no teste de stale carts:', err);
  }
})();
