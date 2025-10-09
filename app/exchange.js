import { nanoid } from "nanoid";
import StatsD from 'node-statsd'
import { init as stateInit, getAccounts as stateAccounts, getRates as stateRates, getLog as stateLog } from "./state.js";

let accounts;
let rates;
let log;

const statsd = new StatsD({
    host: 'graphite',
    port: 8125,
    prefix: 'arVault.'
})

//call to initialize the exchange service
export async function init() {
  await stateInit();

  accounts = stateAccounts();
  rates = stateRates();
  log = stateLog();
}

//returns all internal accounts
export function getAccounts() {
  return accounts;
}

//sets balance for an account
export function setAccountBalance(accountId, balance) {
  const account = findAccountById(accountId);

  if (account != null) {
    account.balance = balance;
  }
}

//returns all current exchange rates
export function getRates() {
  return rates;
}

//returns the whole transaction log
export function getLog() {
  return log;
}

//sets the exchange rate for a given pair of currencies, and the reciprocal rate as well
export function setRate(rateRequest) {
  const { baseCurrency, counterCurrency, rate } = rateRequest;

  rates[baseCurrency][counterCurrency] = rate;
  rates[counterCurrency][baseCurrency] = Number((1 / rate).toFixed(5));
}

//executes an exchange operation
export async function exchange(exchangeRequest) {
    const {
        baseCurrency,
        counterCurrency,
        baseAccountId: clientBaseAccountId,
        counterAccountId: clientCounterAccountId,
        baseAmount,
    } = exchangeRequest;

    const exchangeResult = {
        id: nanoid(),
        ts: new Date(),
        ok: false,
        request: exchangeRequest,
        exchangeRate: 0.0,
        counterAmount: 0.0,
        obs: null,
    };

    if (typeof baseAmount !== 'number' || baseAmount <= 0) {
        exchangeResult.obs = "Invalid baseAmount: must be a positive number.";
        log.push(exchangeResult);
        statsd.increment('exchange.processed');
        return exchangeResult;
    }

    if (baseCurrency === counterCurrency) {
        exchangeResult.obs = "Base and counter currencies cannot be the same.";
        log.push(exchangeResult);
        statsd.increment('exchange.processed');
        return exchangeResult;
    }

    if (!rates[baseCurrency] || !rates[baseCurrency][counterCurrency]) {
        exchangeResult.obs = `Exchange rate not found for ${baseCurrency}/${counterCurrency}`;
        log.push(exchangeResult);
        statsd.increment('exchange.processed');
        return exchangeResult;
    }

    const exchangeRate = rates[baseCurrency][counterCurrency];
    exchangeResult.exchangeRate = exchangeRate;

    const counterAmount = baseAmount * exchangeRate;
    const baseAccount = findAccountByCurrency(baseCurrency);
    const counterAccount = findAccountByCurrency(counterCurrency);

    if (counterAccount.balance >= counterAmount) {
        if (await transfer(clientBaseAccountId, baseAccount.id, baseAmount)) {
            if (await transfer(counterAccount.id, clientCounterAccountId, counterAmount)) {
                baseAccount.balance += baseAmount;
                counterAccount.balance -= counterAmount;
                exchangeResult.ok = true;
                exchangeResult.counterAmount = counterAmount;

                statsd.increment(`exchange.volume.${baseCurrency}`, baseAmount);
                statsd.increment(`exchange.volume.${counterCurrency}`, counterAmount);
                statsd.increment(`exchange.net.${baseCurrency}`, baseAmount);
                statsd.increment(`exchange.net.${counterCurrency}`, -counterAmount);
            } else {
                await transfer(baseAccount.id, clientBaseAccountId, baseAmount);
                exchangeResult.obs = "Could not transfer to clients' account";
            }
        } else {
            exchangeResult.obs = "Could not withdraw from clients' account";
        }
    } else {
        exchangeResult.obs = "Not enough funds on counter currency account";
    }

    log.push(exchangeResult);
    statsd.increment('exchange.processed');
    return exchangeResult;
}

// internal - call transfer service to execute transfer between accounts
async function transfer(fromAccountId, toAccountId, amount) {
  const min = 200;
  const max = 400;
  return new Promise((resolve) =>
    setTimeout(() => resolve(true), Math.random() * (max - min + 1) + min)
  );
}

function findAccountByCurrency(currency) {
  for (let account of accounts) {
    if (account.currency == currency) {
      return account;
    }
  }

  return null;
}

function findAccountById(id) {
  for (let account of accounts) {
    if (account.id == id) {
      return account;
    }
  }

  return null;
}
