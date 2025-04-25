import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Configurações de conexão para o banco de dados PostgreSQL local no Replit
console.log('🔧 Conectando ao banco de dados PostgreSQL local no Replit...');

// Verificar se temos a variável de ambiente do banco de dados
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não encontrada. Certifique-se de que o banco de dados PostgreSQL está provisionado.');
}

// Usar as variáveis de ambiente fornecidas pelo Replit
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Evento para monitorar erros na pool de conexões
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexões:', err.message);
});

// Criação da instância Drizzle
export const db = drizzle(pool, { schema });