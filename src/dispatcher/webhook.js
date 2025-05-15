const axios = require('axios');
const { webhookUrls } = require('../config');

/**
 * Monta o payload para envio ao GoHighLevel de acordo com o tipo de evento.
 * @param {{ type: string, payload: Object }} event
 * @returns {Object} payload formatado
 */
function montarPayload(event) {
  const d = event.payload;
  const base = {
    eventType: event.type,
    timestamp: new Date().toISOString(),
  };

  switch (event.type) {
    case 'userCreated':
      return {
        ...base,
        user: {
          id: d.id,
          type: d.user_type,
          name: d.name,
          email: d.email,
          phone: d.phone,
          birthday: d.birthday,
          companyName: d.company_name,
          fantasyName: d.fantasy_name,
          documentType: d.document_type,
          document: d.document,
          gender: d.gender,
          nationality: d.nationality,
          rdStationUUID: d.rd_station_uuid,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        },
      };

    case 'cartAbandoned':
      const formattedTotal = parseFloat(d.total).toFixed(2);
      return {
        ...base,
        order: {
          id: d.order_id,
          token: d.token,
          userId: d.user_id,
          paymentMethod: d.payment_method,
          total: formattedTotal,
          negotiated: d.negotiated,
          statusId: d.status_id,
          paidAt: d.paid_at,
          shippingMethod: d.shipping_method,
          shippingCompany: d.shipping_company,
          shippingValue: d.shipping_value,
          voucherCode: d.voucher_code,
          itemCount: d.num_items,
          dueAt: d.due_at,
          seller: d.seller,
          observation: d.observation,
          type: d.order_type,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          user: {
            name: d.user_name,
            email: d.user_email,
            phone: d.user_phone,
          },
        },
      };

    default:
      return { ...base, data: d };
  }
}

/**
 * Envia o evento ao GoHighLevel via HTTP POST para URLs específicas de cada evento.
 * @param {{ type: string, payload: Object }} event
 * @returns {Promise<Object>} resposta da API
 */
async function sendToGHL(event) {
  const url = webhookUrls[event.type];
  if (!url) {
    throw new Error(`Nenhuma URL de webhook configurada para evento "${event.type}"`);
  }

  const payload = montarPayload(event);
  console.log(`📤 [${event.type}] Enviando para ${url}:`, JSON.stringify(payload, null, 2));

  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  console.log(`📥 [${event.type}] Resposta:`, response.status, response.data);
  return response.data;
}

module.exports = { montarPayload, sendToGHL };
