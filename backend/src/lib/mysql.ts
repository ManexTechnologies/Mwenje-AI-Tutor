import mysql, { Pool, PoolConnection } from 'mysql2/promise'

let pool: Pool | null = null
let initialized = false

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const host = process.env.DB_HOST || '127.0.0.1'
  const port = process.env.DB_PORT || '3306'
  const user = process.env.DB_USER || 'root'
  const password = process.env.DB_PASSWORD ?? ''
  const database = process.env.DB_NAME || 'mwenje'

  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
}

function getDatabaseConfig() {
  const url = new URL(getDatabaseUrl())
  return {
    host: process.env.DB_HOST || url.hostname || '127.0.0.1',
    port: Number(process.env.DB_PORT || url.port || 3306),
    user: process.env.DB_USER || decodeURIComponent(url.username || 'root'),
    password: process.env.DB_PASSWORD ?? decodeURIComponent(url.password || ''),
    database: process.env.DB_NAME || url.pathname.replace(/^\//, '') || 'mwenje'
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
      learning_goals JSON NULL,
      preferred_learning_style VARCHAR(100) NOT NULL DEFAULT '',
      weak_areas JSON NULL,
      examination_year INT NULL,
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

    CREATE TABLE IF NOT EXISTS tutor_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      subject VARCHAR(100) NOT NULL,
      grade VARCHAR(100) NULL,
      mode VARCHAR(50) NOT NULL DEFAULT 'explain',
      title VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_tutor_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_tutor_sessions_user (user_id),
      INDEX idx_tutor_sessions_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS tutor_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      role ENUM('user', 'assistant') NOT NULL,
      content LONGTEXT NOT NULL,
      source VARCHAR(50) NOT NULL DEFAULT 'claude',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_tutor_messages_session FOREIGN KEY (session_id) REFERENCES tutor_sessions(id) ON DELETE CASCADE,
      INDEX idx_tutor_messages_session (session_id),
      INDEX idx_tutor_messages_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS quiz_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      subject VARCHAR(100) NOT NULL,
      topic VARCHAR(255) NOT NULL DEFAULT '',
      difficulty VARCHAR(50) NOT NULL DEFAULT '',
      score INT NOT NULL,
      total_questions INT NOT NULL DEFAULT 0,
      correct_answers INT NOT NULL DEFAULT 0,
      duration_seconds INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_quiz_results_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_quiz_results_user (user_id),
      INDEX idx_quiz_results_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS study_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      subjects JSON NOT NULL,
      weak_subjects JSON NOT NULL,
      exam_date DATE NULL,
      hours_per_day DECIMAL(4,1) NOT NULL DEFAULT 2,
      plan JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_study_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_study_plans_user (user_id),
      INDEX idx_study_plans_created (created_at)
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

  const profileColumns = [
    ['learning_goals', 'ALTER TABLE profiles ADD COLUMN learning_goals JSON NULL AFTER subjects'],
    ['preferred_learning_style', "ALTER TABLE profiles ADD COLUMN preferred_learning_style VARCHAR(100) NOT NULL DEFAULT '' AFTER learning_goals"],
    ['weak_areas', 'ALTER TABLE profiles ADD COLUMN weak_areas JSON NULL AFTER preferred_learning_style'],
    ['examination_year', 'ALTER TABLE profiles ADD COLUMN examination_year INT NULL AFTER weak_areas']
  ] as const

  for (const [column, statement] of profileColumns) {
    const [columns] = await getPool().query<any[]>(`SHOW COLUMNS FROM profiles LIKE ?`, [column])
    if (!columns.length) await getPool().query(statement)
  }

  initialized = true
}
