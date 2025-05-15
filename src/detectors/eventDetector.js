const STATUS = require('./statusCodes');

/**
 * Detecta eventos a partir de registros unificados.
 * Eventos:
 *  - userCreated: usuário completo em 'users' ou comprador em 'orders_buyer'
 *  - cartAbandoned: pedido em 'orders' pendente > 3 minutos
 *
 * @param {Array<Object>} records - Lista de registros das tabelas users, orders e orders_buyer
 * @param {Object} stateStore - Módulo de controle de estado
 * @returns {Array<{type: string, payload: Object}>}
 */
function detectEvents(records, stateStore) {
  const events = [];

  for (const r of records) {
    const prev = stateStore.get(r.source_table, r.id) || {};

    // 1) Novo usuário completo diretamente em 'users'
    if (r.source_table === 'users') {
      const hasComplete = r.name && r.email && r.phone;
      if (hasComplete && !prev.processed) {
        events.push({ type: 'userCreated', payload: r });
      }
    }
    
    // 2) Novo usuário via 'orders_buyer'
    else if (r.source_table === 'orders_buyer') {
      if (!prev.processed) {
        const fullName = [r.first_name, r.last_name]
          .filter(Boolean)
          .join(' ');
        const payload = {
          source_table: r.source_table,
          record_id: r.id,
          id: r.user_id,
          name: fullName,
          email: r.email,
          phone: r.phone,
          documentType: r.document_type,
          document: r.document,
          createdAt: r.created_at,
          updatedAt: r.updated_at || r.created_at,
        };
        events.push({ type: 'userCreated', payload });
      }
    }
    
    // 3) Carrinho abandonado em 'orders' (>3 minutos pendente)
    else if (r.source_table === 'orders') {
      const isPending    = r.status_id === STATUS.AWAITING_PAYMENT;
      const createdAt    = new Date(r.created_at);
      const oneHourAgo   = new Date(Date.now() - 60 * 60 * 1000);

      if (isPending && createdAt <= oneHourAgo && !prev.processed) {
        events.push({ type: 'cartAbandoned', payload: r });
      }
    }
  }

  return events;
}

module.exports = { detectEvents };
