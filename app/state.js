import { connectToDatabase } from './database/connection.js';
import Account from './models/Account.js';
import Rate from './models/Rate.js';
import TransactionLog from './models/TransactionLog.js';

// Con MongoDB, ya no necesitamos mantener datos en memoria
// ni guardar periodicamente - la base de datos maneja la persistencia
export async function init() {
  await connectToDatabase();
  console.log('State initialized with MongoDB connection');
}

export async function getAccounts() {
  try {
    return await Account.find({}).lean();
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
}

export async function getRates() {
  try {
    const rates = await Rate.find({}).lean();
    
    // Convertir a la estructura original anidada
    const ratesStructure = {};
    
    rates.forEach(rate => {
      if (!ratesStructure[rate.baseCurrency]) {
        ratesStructure[rate.baseCurrency] = {};
      }
      ratesStructure[rate.baseCurrency][rate.counterCurrency] = rate.rate;
    });
    
    return ratesStructure;
  } catch (error) {
    console.error('Error fetching rates:', error);
    throw error;
  }
}

export async function getLog() {
  try {
    return await TransactionLog.find({}).lean();
  } catch (error) {
    console.error('Error fetching transaction log:', error);
    throw error;
  }
}

export async function updateAccountBalance(accountId, balance) {
  try {
    const result = await Account.findOneAndUpdate(
      { id: accountId },
      { balance: balance },
      { new: true }
    );
    return result;
  } catch (error) {
    console.error('Error updating account balance:', error);
    throw error;
  }
}

export async function updateRate(baseCurrency, counterCurrency, rate) {
  try {
    // Actualizar la tasa principal
    await Rate.findOneAndUpdate(
      { baseCurrency, counterCurrency },
      { rate },
      { upsert: true, new: true }
    );
    
    // Actualizar la tasa inversa
    const inverseRate = Number((1 / rate).toFixed(5));
    await Rate.findOneAndUpdate(
      { baseCurrency: counterCurrency, counterCurrency: baseCurrency },
      { rate: inverseRate },
      { upsert: true, new: true }
    );
    
  } catch (error) {
    console.error('Error updating rate:', error);
    throw error;
  }
}

export async function addTransactionLog(transaction) {
  try {
    const newTransaction = new TransactionLog(transaction);
    return await newTransaction.save();
  } catch (error) {
    console.error('Error adding transaction log:', error);
    throw error;
  }
}

export async function findAccountById(accountId) {
  try {
    return await Account.findOne({ id: accountId }).lean();
  } catch (error) {
    console.error('Error finding account by id:', error);
    throw error;
  }
}

export async function findAccountByCurrency(currency) {
  try {
    return await Account.findOne({ currency }).lean();
  } catch (error) {
    console.error('Error finding account by currency:', error);
    throw error;
  }
}

export async function getRate(baseCurrency, counterCurrency) {
  try {
    const rateDoc = await Rate.findOne({ baseCurrency, counterCurrency }).lean();
    return rateDoc ? rateDoc.rate : null;
  } catch (error) {
    console.error('Error getting rate:', error);
    throw error;
  }
}
