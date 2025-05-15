const mysql = require('mysql2/promise');
const config = require('../config');
const STATUS = require('../detectors/statusCodes');

// Cria o pool de conexões com o MySQL
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

/**
 * Busca registros novos ou atualizados desde lastRunAt.
 * Retorna um array unificado de users, orders e orders_buyer.
 * @param {Date|null} lastRunAt
 * @returns {Promise<Array<Object>>}
 */
async function fetchNewOrUpdated(lastRunAt) {
  const since = lastRunAt
    ? lastRunAt.toISOString().slice(0, 19).replace('T', ' ')
    : '1970-01-01 00:00:00';

  const [rows] = await pool.query(
    `
    SELECT
      'users'         AS source_table,
      id,
      type            AS user_type,
      name,
      email,
      phone,
      birthday,
      company_name,
      fantasy_name,
      document_type,
      document,
      gender,
      nationality,
      created_at,
      last_login_at   AS updated_at,
      rd_station_uuid,
      NULL            AS order_id,
      NULL            AS token,
      NULL            AS user_id,
      NULL            AS payment_method,
      NULL            AS total,
      NULL            AS negotiated,
      NULL            AS status_id,
      NULL            AS paid_at,
      NULL            AS shipping_method,
      NULL            AS shipping_company,
      NULL            AS shipping_value,
      NULL            AS voucher_code,
      NULL            AS num_items,
      NULL            AS due_at,
      NULL            AS seller,
      NULL            AS observation,
      NULL            AS order_type,
      NULL            AS user_name,
      NULL            AS user_email,
      NULL            AS user_phone
    FROM users
    WHERE created_at > ? OR last_login_at > ?

    UNION ALL

    SELECT
      'orders'        AS source_table,
      o.id            AS id,
      NULL            AS user_type,
      NULL            AS name,
      NULL            AS email,
      NULL            AS phone,
      NULL            AS birthday,
      NULL            AS company_name,
      NULL            AS fantasy_name,
      NULL            AS document_type,
      NULL            AS document,
      NULL            AS gender,
      NULL            AS nationality,
      o.created_at,
      o.updated_at,
      NULL            AS rd_station_uuid,
      o.id            AS order_id,
      o.token,
      o.user_id,
      o.payment_method,
      o.total,
      o.negotiated,
      o.status_id,
      o.paid_at,
      o.shipping_method,
      o.shipping_company,
      o.shipping_value,
      o.voucher_code,
      o.num_itens     AS num_items,
      o.due_at,
      o.seller,
      o.observation,
      o.type          AS order_type,
      u.name          AS user_name,
      u.email         AS user_email,
      u.phone         AS user_phone
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.created_at > ? OR o.updated_at > ?

    UNION ALL

    SELECT
      'orders_buyer'  AS source_table,
      order_id        AS id,
      NULL            AS user_type,
      first_name      AS name,
      email,
      phone,
      NULL            AS birthday,
      NULL            AS company_name,
      NULL            AS fantasy_name,
      NULL            AS document_type,
      NULL            AS document,
      NULL            AS gender,
      NULL            AS nationality,
      created_at,
      created_at      AS updated_at,
      NULL            AS rd_station_uuid,
      order_id        AS order_id,
      NULL            AS token,
      user_id,
      NULL            AS payment_method,
      NULL            AS total,
      NULL            AS negotiated,
      NULL            AS status_id,
      NULL            AS paid_at,
      NULL            AS shipping_method,
      NULL            AS shipping_company,
      NULL            AS shipping_value,
      NULL            AS voucher_code,
      NULL            AS num_items,
      NULL            AS due_at,
      NULL            AS seller,
      NULL            AS observation,
      NULL            AS order_type,
      NULL            AS user_name,
      NULL            AS user_email,
      NULL            AS user_phone
    FROM orders_buyer
    WHERE created_at > ?;
    `,
    [since, since, since, since, since]
  );

  return rows;
}

/**
 * Busca pedidos pendentes (status AWAITING_PAYMENT) com mais de 3 minutos desde created_at.
 * @returns {Promise<Array<Object>>}
 */
async function fetchStaleCarts() {
  const [rows] = await pool.query(
    `
    SELECT
      'orders'        AS source_table,
      o.id            AS id,
      NULL            AS user_type,
      NULL            AS name,
      NULL            AS email,
      NULL            AS phone,
      NULL            AS birthday,
      NULL            AS company_name,
      NULL            AS fantasy_name,
      NULL            AS document_type,
      NULL            AS document,
      NULL            AS gender,
      NULL            AS nationality,
      o.created_at,
      o.updated_at,
      NULL            AS rd_station_uuid,
      o.id            AS order_id,
      o.token,
      o.user_id,
      o.payment_method,
      o.total,
      o.negotiated,
      o.status_id,
      o.paid_at,
      o.shipping_method,
      o.shipping_company,
      o.shipping_value,
      o.voucher_code,
      o.num_itens     AS num_items,
      o.due_at,
      o.seller,
      o.observation,
      o.type          AS order_type,
      u.name          AS user_name,
      u.email         AS user_email,
      u.phone         AS user_phone
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.status_id = ?
      AND o.created_at <= DATE_SUB(NOW(), INTERVAL 3 MINUTE)
    `,
    [STATUS.AWAITING_PAYMENT]
  );

  return rows;
}

module.exports = { fetchNewOrUpdated, fetchStaleCarts };
