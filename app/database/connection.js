import mongoose from 'mongoose';
import fs from 'fs';

let isConnected = false;

// Crear stream para registrar logs (opcional) — usar try/catch para evitar que un problema
// de permisos detenga la aplicación. Si falla, usamos un 'fallback' que no hace nada.
let logStream;
try {
  logStream = fs.createWriteStream('query_times.log', { flags: 'a' });
  // Evitar que errores en el stream emitan como no manejados
  logStream.on('error', (err) => {
    console.error('Log stream error:', err.message || err);
  });
} catch (e) {
  console.error('Could not open query_times.log for writing, continuing without file logging:', e.message || e);
  logStream = {
    write: () => {},
    end: () => {},
    destroy: () => {},
    destroyed: true,
  };
}

// Umbral mínimo (en milisegundos) para registrar consultas lentas
const SLOW_QUERY_THRESHOLD = 50;

export async function connectToDatabase() {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const connectionString = process.env.MONGODB_URI;

    if (!connectionString) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(connectionString, {
      dbName: process.env.DB_NAME || 'exchange-service',
    });

    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas');

    // --- 🔍 Middleware global de Mongoose para medir tiempos de consulta ---
    mongoose.set('debug', function (collectionName, method, query, doc, options) {
      const start = process.hrtime();

      // Guardar el callback original
      const originalCallback = this && this.callback;

      // Reemplazar el callback con uno que mida el tiempo al finalizar
      this.callback = function (...args) {
        const diff = process.hrtime(start);
        const timeMs = diff[0] * 1000 + diff[1] / 1e6;
        const date = new Date();
        const timestamp = date.toISOString();

        // Intentar serializar la query sin romper si hay ciclos
        let safeQuery;
        try {
          safeQuery = JSON.stringify(query);
        } catch (e) {
          safeQuery = '[unserializable query]';
        }

        //if (timeMs >= SLOW_QUERY_THRESHOLD) {
          const log = ` [Mongo] ${timestamp} ${collectionName}.${method} (${timeMs.toFixed(2)} ms) ${safeQuery}\n`;
          logStream.write(log);
          console.log(log.trim());
        //}

        // Llamar al callback original para continuar la ejecución (si existe)
        if (typeof originalCallback === 'function') {
          return originalCallback.apply(this, args);
        }
        // Si no hay callback (p. ej. uso de promesas), simplemente devolver undefined
        return undefined;
      };
    });
    // -----------------------------------------------------------------------

    // --- 🔁 Instrumentar Query.exec para medir promesas/exec() ----------------
    // Evitar doble-wrap
    if (!mongoose.Query.prototype._timingWrapped) {
      const originalExec = mongoose.Query.prototype.exec;
      mongoose.Query.prototype.exec = async function (...args) {
        const start = process.hrtime();
        try {
          const res = await originalExec.apply(this, args);
          const diff = process.hrtime(start);
          const timeMs = diff[0] * 1000 + diff[1] / 1e6;

          let safeQuery;
          try {
            safeQuery = JSON.stringify(this.getQuery ? this.getQuery() : this);
          } catch (e) {
            safeQuery = '[unserializable query]';
          }

          const modelName = this.model && this.model.collection && this.model.collection.name ? this.model.collection.name : 'unknown';
          const method = this.op || 'exec';
          const timestamp = new Date().toISOString();
          const log = `[Mongo] ${timestamp} ${modelName}.${method} (${timeMs.toFixed(2)} ms) ${safeQuery}\n`;
          logStream.write(log);
          console.log(log.trim());

          return res;
        } catch (err) {
          const diff = process.hrtime(start);
          const timeMs = diff[0] * 1000 + diff[1] / 1e6;
          let safeQuery;
          try {
            safeQuery = JSON.stringify(this.getQuery ? this.getQuery() : this);
          } catch (e) {
            safeQuery = '[unserializable query]';
          }
          const modelName = this.model && this.model.collection && this.model.collection.name ? this.model.collection.name : 'unknown';
          const method = this.op || 'exec';
          const timestamp = new Date().toISOString();
          const log = `[Mongo][ERR] ${timestamp} ${modelName}.${method} (${timeMs.toFixed(2)} ms) ${safeQuery} error=${err && err.message ? err.message : String(err)}\n`;
          logStream.write(log);
          console.error(log.trim());
          throw err;
        }
      };
      mongoose.Query.prototype._timingWrapped = true;
    }

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ Database connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Database disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Database reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    isConnected = false;
    throw error;
  }
}

export async function disconnectFromDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB Atlas');
  }
}

// Cerrar el stream de logs de manera segura al terminar el proceso
function closeLogStream() {
  try {
    if (logStream && !logStream.destroyed) {
      logStream.end();
      // pequeño timeout para permitir flush
      setTimeout(() => {
        try { logStream.destroy(); } catch (e) { /* ignore */ }
      }, 200);
    }
  } catch (e) {
    // no bloquear el proceso por errores de logging
  }
}

process.on('exit', () => closeLogStream());
process.on('SIGINT', () => {
  closeLogStream();
  process.exit(0);
});
process.on('SIGTERM', () => {
  closeLogStream();
  process.exit(0);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  closeLogStream();
});

export function getDatabaseConnectionStatus() {
  return isConnected;
}
