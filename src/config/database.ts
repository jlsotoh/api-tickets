import mssql from 'mssql';
import { env } from './env';

export const dbConfig: mssql.config = {
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  server: env.DB_SERVER,
  port: env.DB_PORT,
  database: env.DB_NAME,
  options: {
    encrypt: env.DB_ENCRYPT,
    trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

/**
 * Pool de conexión global para ser reutilizado en toda la aplicación
 */
export const poolPromise = new mssql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log('✅ Conectado a SQL Server');
    return pool;
  })
  .catch((err) => {
    console.error('❌ Error al conectar con SQL Server:', err);
    throw err;
  });

export default mssql;
