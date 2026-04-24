import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  API_KEY: z.string().min(1, 'API_KEY es requerida'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET es requerido'),
  JWT_EXPIRATION: z.string().default('24h'),

  // Database Configuration
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SERVER: z.string().min(1),
  DB_PORT: z.string().default('1433').transform(Number),
  DB_NAME: z.string().min(1),
  DB_ENCRYPT: z.string().default('false').transform((v) => v === 'true'),
  DB_TRUST_SERVER_CERTIFICATE: z.string().default('true').transform((v) => v === 'true'),

  // CORS Configuration
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000').transform((v) => v.split(',')),

  // FTP DATOS
  HOST_FTP: z.string().min(1),
  USER_FTP: z.string().min(1),
  PASS_FTP: z.string().min(1),
  URL_TICKETS: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
