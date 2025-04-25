import { db, pool } from './db';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { users, agents, agentPrompts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from './auth';

/**
 * Verifica se a tabela especificada existe no banco de dados
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = $1
      );
    `, [tableName]);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Erro ao verificar se a tabela ${tableName} existe:`, error);
    return false;
  }
}

/**
 * Cria as tabelas do schema manualmente se necessário
 */
async function createTablesIfNotExist() {
  try {
    // Verifica se a tabela de usuários existe
    const usersTableExists = await checkTableExists('users');
    
    if (!usersTableExists) {
      console.log('🔧 Criando tabelas do banco de dados...');
      
      // Criação da tabela users
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          "isAdmin" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Criação da tabela agents
      await pool.query(`
        CREATE TABLE IF NOT EXISTS agents (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          icon TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Criação da tabela agent_prompts
      await pool.query(`
        CREATE TABLE IF NOT EXISTS agent_prompts (
          id SERIAL PRIMARY KEY,
          "agentId" INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
          prompt TEXT NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabelas criadas com sucesso!');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
}

/**
 * Cria dados iniciais se as tabelas estiverem vazias
 */
async function seedInitialData() {
  try {
    // Verifica se já existem usuários
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      console.log('🌱 Populando banco de dados com dados iniciais...');
      
      // Cria usuário admin
      const adminPassword = await hashPassword('admin');
      await db.insert(users).values({
        username: 'admin',
        password: adminPassword,
        isAdmin: true
      });
      
      // Lista de agentes
      const agentsList = [
        { title: 'Comercial', description: 'Assistente virtual para equipes comerciais e vendas', icon: 'fas fa-briefcase' },
        { title: 'Clínicas', description: 'Assistente especializado para clínicas e consultórios médicos', icon: 'fas fa-clinic-medical' },
        { title: 'Imobiliárias', description: 'Assistente para corretores e profissionais do setor imobiliário', icon: 'fas fa-home' },
        { title: 'Jurídico', description: 'Assistente virtual para escritórios de advocacia e profissionais da área jurídica', icon: 'fas fa-balance-scale' },
        { title: 'Financeiro', description: 'Assistente especializado em finanças, contabilidade e planejamento financeiro', icon: 'fas fa-chart-line' },
        { title: 'Educação', description: 'Assistente virtual para instituições de ensino e professores', icon: 'fas fa-graduation-cap' },
        { title: 'Restaurantes', description: 'Assistente para estabelecimentos gastronômicos e delivery', icon: 'fas fa-utensils' },
        { title: 'Eventos', description: 'Assistente especializado em organização e promoção de eventos', icon: 'fas fa-calendar-alt' },
        { title: 'Recursos Humanos', description: 'Assistente para recrutamento, seleção e gestão de pessoas', icon: 'fas fa-users' },
        { title: 'Saúde', description: 'Assistente virtual para profissionais da área da saúde', icon: 'fas fa-heartbeat' },
        { title: 'Varejo', description: 'Assistente especializado em lojas físicas e e-commerce', icon: 'fas fa-shopping-cart' },
        { title: 'Tecnologia', description: 'Assistente para empresas e profissionais de tecnologia', icon: 'fas fa-laptop-code' }
      ];
      
      // Insere os agentes
      for (const agent of agentsList) {
        await db.insert(agents).values(agent);
      }
      
      console.log('✅ Dados iniciais criados com sucesso!');
    } else {
      console.log('ℹ️ Dados iniciais já existem no banco de dados.');
    }
  } catch (error) {
    console.error('❌ Erro ao criar dados iniciais:', error);
    throw error;
  }
}

/**
 * Inicializa o banco de dados
 */
export async function initializeDatabase() {
  try {
    console.log('🔍 Verificando banco de dados...');
    
    // Verifica e cria tabelas se necessário
    const tablesCreated = await createTablesIfNotExist();
    
    // Se as tabelas foram criadas ou já existiam, verifica os dados iniciais
    await seedInitialData();
    
    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Falha ao inicializar banco de dados:', error);
    throw error;
  }
}