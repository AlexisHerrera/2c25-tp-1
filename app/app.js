import dotenv from 'dotenv';
dotenv.config();

import express from "express";

import {
  init as exchangeInit,
  getAccounts,
  setAccountBalance,
  getRates,
  setRate,
  getLog,
  exchange,
} from "./exchange.js";


await exchangeInit();

const app = express();
const port = 3000;

console.log("🚀 Hot reload is working! Server starting with secure env variables...");

app.use(express.json());

// ACCOUNT endpoints

app.get("/accounts", async (req, res) => {
  try {
    const accounts = await getAccounts();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: "Error fetching accounts" });
  }
});


// Si actualizo solo una cuenta, no es necesario enviar todas las cuentas
// implementar que solo se envie la cuenta a actualizar

app.put("/accounts/:id/balance", async (req, res) => {
  const accountId = parseInt(req.params.id);
  const { balance } = req.body;

  if (!accountId || balance === undefined) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    try {
      await setAccountBalance(accountId, balance);
      const accounts = await getAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Error updating account balance" });
    }
  }
});

// RATE endpoints

app.get("/rates", async (req, res) => {
  try {
    const rates = await getRates();
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: "Error fetching rates" });
  }
});

app.put("/rates", async (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
  }

  try {
    const newRateRequest = { ...req.body };
    await setRate(newRateRequest);
    const rates = await getRates();
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: "Error updating rates" });
  }
});

// LOG endpoint

app.get("/log", async (req, res) => {
  try {
    const log = await getLog();
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: "Error fetching transaction log" });
  }
});

// EXCHANGE endpoint

app.post("/exchange", async (req, res) => {
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId,
    counterAccountId,
    baseAmount,
  } = req.body;
  console.log(req.body);

  if (
    !baseCurrency ||
    !counterCurrency ||
    !baseAccountId ||
    !counterAccountId ||
    !baseAmount
  ) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const exchangeRequest = { ...req.body };
  const exchangeResult = await exchange(exchangeRequest);

  if (exchangeResult.ok) {
    res.status(200).json(exchangeResult);
  } else {
    res.status(500).json(exchangeResult);
  }
});

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
