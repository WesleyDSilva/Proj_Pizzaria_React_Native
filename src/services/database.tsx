import SQLite from 'react-native-sqlite-storage';

// Habilitar promessas para o SQLite
SQLite.enablePromise(true);

const databaseParams = {
  name: 'pizzas.db',
  location: 'default',
};

interface Database {
  executeSql: (sql: string, params?: any[]) => Promise<any>;
}


// Tipo para Pizza
export type Pizza = {
  id: string; // Identificador único
  nome: string; // Nome da pizza
  preco: number; // Preço da pizza
  quantidade: number; // Quantidade adicionada
};

// Obter conexão com o banco de dados
export const getDBConnection = async (): Promise<Database> => {
  try {
    const db = await SQLite.openDatabase(databaseParams);
    console.log('Banco de dados conectado com sucesso');
    return db;
  } catch (error) {
    console.error('Erro ao abrir o banco de dados:', error);
    throw new Error('Falha de conexão com o banco de dados');
  }
};

// Criar tabela de pizzas
export const createPizzaTable = async (db: Database): Promise<void> => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS pizza_items (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        quantidade INTEGER NOT NULL
      );
    `;
    await db.executeSql(query);
    console.log('Tabela de pizzas criada com sucesso');
  } catch (error) {
    console.error('Erro ao criar a tabela de pizzas:', error);
    throw new Error('Falha ao criar tabela no banco de dados');
  }
};

// Adicionar uma pizza ao banco
export const addPizza = async (db: Database, pizza: Pizza): Promise<void> => {
  try {
    const query = `
      INSERT INTO pizza_items (id, nome, preco, quantidade) 
      VALUES (?, ?, ?, ?);
    `;
    await db.executeSql(query, [pizza.id, pizza.nome, pizza.preco, pizza.quantidade]);
    console.log(`Pizza adicionada: ${pizza.nome}`);
  } catch (error) {
    console.error('Erro ao adicionar pizza:', error);
    throw new Error('Falha ao adicionar pizza no banco de dados');
  }
};

// Obter todas as pizzas do banco
export const getPizzas = async (db: Database): Promise<Pizza[]> => {
  try {
    const query = `SELECT id, nome, preco, quantidade FROM pizza_items;`;
    const result = await db.executeSql(query);

    const pizzas: Pizza[] = [];
    const rows = result[0].rows;

    for (let i = 0; i < rows.length; i++) {
      const item = rows.item(i);
      pizzas.push({
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        quantidade: item.quantidade,
      });
    }

    return pizzas;
  } catch (error) {
    console.error('Erro ao buscar pizzas:', error);
    throw new Error('Falha ao buscar pizzas no banco de dados');
  }
};

// Atualizar quantidade de uma pizza
export const updatePizzaQuantity = async (
  db: Database,
  id: string,
  quantidade: number
): Promise<void> => {
  try {
    const query = `
      UPDATE pizza_items 
      SET quantidade = ? 
      WHERE id = ?;
    `;
    await db.executeSql(query, [quantidade, id]);
    console.log(`Quantidade da pizza atualizada: ${id}`);
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error);
    throw new Error('Falha ao atualizar quantidade no banco de dados');
  }
};

// Excluir uma pizza do banco
export const deletePizza = async (db: Database, id: string): Promise<void> => {
  try {
    const query = `DELETE FROM pizza_items WHERE id = ?;`;
    await db.executeSql(query, [id]);
    console.log(`Pizza excluída: ${id}`);
  } catch (error) {
    console.error('Erro ao excluir pizza:', error);
    throw new Error('Falha ao excluir pizza do banco de dados');
  }
};

// Limpar todas as pizzas do banco
export const clearPizzas = async (db: Database): Promise<void> => {
  try {
    const query = `DELETE FROM pizza_items;`;
    await db.executeSql(query);
    console.log('Todas as pizzas foram removidas do banco');
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
    throw new Error('Falha ao limpar banco de dados');
  }
};
