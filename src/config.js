// src/config.js
require('dotenv').config();

module.exports = {
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },

  // Mapeamento de eventos → URL de webhook
  webhookUrls: {
    userCreated:      process.env.WEBHOOK_URL_USER_CREATED,
    cartAbandoned:    process.env.WEBHOOK_URL_CART_ABANDONED,
    // se tiver outros eventos:
    // orderConfirmed:   process.env.WEBHOOK_URL_ORDER_CONFIRMED,
  },
};
