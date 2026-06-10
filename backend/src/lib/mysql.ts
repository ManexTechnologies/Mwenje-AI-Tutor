import mysql, { Pool, PoolConnection } from 'mysql2/promise'

let pool: Pool | null = null
let initialized = false

function getDatabaseUrl() {
  return process.env.DATABASE_URL || 'mysql://root:@localhost:3306/mwenje_ai_tutor'
}

function getDatabaseConfig() {
  const url = new URL(getDatabaseUrl())
  return {
    host: url.hostname || 'localhost',
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || 'root'),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.replace(/^\//, '') || 'mwenje_ai_tutor'
  }
}

async function ensureDatabase() {
  const config = getDatabaseConfig()
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true
  })

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  } finally {
    await connection.end()
  }
}

export function getPool() {
  if (pool) return pool

  const config = getDatabaseConfig()
  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    multipleStatements: true
  })
  return pool
}

export async function withConnection<T>(handler: (connection: PoolConnection) => Promise<T>) {
  const connection = await getPool().getConnection()
  try {
    return await handler(connection)
  } finally {
    connection.release()
  }
}

export async function ensureMysqlSchema() {
  if (process.env.NODE_ENV === 'test' || initialized) return

  await ensureDatabase()
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
      subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free-trial',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS profiles (
      user_id INT PRIMARY KEY,
      school VARCHAR(255) NOT NULL DEFAULT '',
      grade VARCHAR(100) NOT NULL DEFAULT '',
      curriculum VARCHAR(100) NOT NULL DEFAULT 'ZIMSEC',
      subjects JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS progress (
      user_id INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL DEFAULT 'Learner',
      xp_points INT NOT NULL DEFAULT 0,
      streak_days INT NOT NULL DEFAULT 0,
      last_activity_date DATE NULL,
      subjects JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  const [subscriptionColumns] = await getPool().query<any[]>(
    `SHOW COLUMNS FROM users LIKE 'subscription_plan'`
  )

  if (!subscriptionColumns.length) {
    await getPool().query(
      `ALTER TABLE users ADD COLUMN subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free-trial' AFTER role`
    )
  }

  initialized = true
}
