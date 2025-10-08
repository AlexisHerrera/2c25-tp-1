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
import StatsD from "node-statsd";
import os from "os";
import http from "http";

let statsd;

async function getContainerNameFromSocket() {
  try {
    const containerId = os.hostname();

    const options = {
      socketPath: "/var/run/docker.sock",
      path: `/containers/${containerId}/json`,
      method: "GET",
    };

    return await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            return reject(new Error(`Docker API responded with ${res.statusCode}: ${data}`));
          }
          try {
            const info = JSON.parse(data);
            resolve(info.Name.replace(/^\//, ""));
          } catch (err) {
            reject(err);
          }
        });
      });
      req.on("error", reject);
      req.end();
    });
  } catch (err) {
    console.error("Error obteniendo nombre del contenedor:", err.message);
    return os.hostname();
  }
}

async function main() {
  await exchangeInit();

  const app = express();
  const port = 3000;

  const instanceId = await getContainerNameFromSocket();
  console.log(`Instance ID resolved to: ${instanceId}`);

  const statsdPrefix = `arVault.${instanceId}.`;

  statsd = new StatsD({
    host: 'graphite',
    port: 8125,
    prefix: statsdPrefix,
    cacheDns: true
  });

  app.use(express.json());

  // Middleware para medir el tiempo de respuesta y códigos de estado
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const routeName = (req.route ? req.route.path.replace(/\//g, '_').replace(/:/g, '') : 'unknown_route').replace(/^_/, '');

      if (statsd) {
        // Métrica de tiempo de respuesta para el endpoint específico
        statsd.timing(`response_time_${routeName}`, duration);

        // Métrica para códigos de estado
        const statusCode = res.statusCode;
        statsd.increment(`codes.${statusCode}`);

        // Agrupamos en 2xx, 4xx, 5xx para el gráfico de errores
        if (statusCode >= 200 && statusCode < 300) {
          statsd.increment('codes.2xx');
        } else if (statusCode >= 400 && statusCode < 500) {
          statsd.increment('codes.4xx');
        } else if (statusCode >= 500) {
          statsd.increment('codes.5xx');
        }
      }
    });
    next();
  });

  // ACCOUNT endpoints
  app.get("/accounts", (req, res) => {
    res.json(getAccounts());
  });

  app.put("/accounts/:id/balance", (req, res) => {
    const accountId = req.params.id;
    const { balance } = req.body;

    if (!accountId || !balance) {
      return res.status(400).json({ error: "Malformed request" });
    } else {
      setAccountBalance(accountId, balance);
      res.json(getAccounts());
    }
  });

  // RATE endpoints
  app.get("/rates", (req, res) => {
    res.json(getRates());
  });

  app.put("/rates", (req, res) => {
    const { baseCurrency, counterCurrency, rate } = req.body;

    if (!baseCurrency || !counterCurrency || !rate) {
      return res.status(400).json({ error: "Malformed request" });
    }

    const newRateRequest = { ...req.body };
    setRate(newRateRequest);
    res.json(getRates());
  });

  // LOG endpoint
  app.get("/log", (req, res) => {
    res.json(getLog());
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

    const exchangeResult = await exchange(exchangeRequest, statsd);

    if (exchangeResult.ok) {
      res.status(200).json(exchangeResult);
    } else {
      res.status(500).json(exchangeResult);
    }
  });

  app.listen(port, () => {
    console.log(`Exchange API listening on port ${port}`);
  });
}

main();