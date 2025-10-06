import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { connectToDatabase } from './database/connection.js';
import Account from './models/Account.js';
import Rate from './models/Rate.js';
import TransactionLog from './models/TransactionLog.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    
    // Limpiar datos existentes
    console.log('Clearing existing data...');
    await Account.deleteMany({});
    await Rate.deleteMany({});
    await TransactionLog.deleteMany({});
    
    // Cargar datos desde los archivos JSON
    const accountsData = JSON.parse(readFileSync(path.join(__dirname, 'state/accounts.json'), 'utf8'));
    const ratesData = JSON.parse(readFileSync(path.join(__dirname, 'state/rates.json'), 'utf8'));
    
    // Insertar cuentas
    console.log('Seeding accounts...');
    await Account.insertMany(accountsData);
    console.log(`Inserted ${accountsData.length} accounts`);
    
    // Convertir y insertar tasas de cambio
    console.log('Seeding exchange rates...');
    const ratesArray = [];
    
    for (const baseCurrency in ratesData) {
      for (const counterCurrency in ratesData[baseCurrency]) {
        ratesArray.push({
          baseCurrency,
          counterCurrency,
          rate: ratesData[baseCurrency][counterCurrency]
        });
      }
    }
    
    await Rate.insertMany(ratesArray);
    console.log(`Inserted ${ratesArray.length} exchange rates`);
    
    // El log inicia vacío, no necesita seeding
    console.log('Database seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar el seeding
seedDatabase();