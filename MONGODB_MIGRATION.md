# Migración a MongoDB Atlas

Este proyecto ha sido migrado de almacenamiento en archivos JSON a MongoDB Atlas.

## Configuración de MongoDB Atlas

### 1. Crear una cuenta en MongoDB Atlas
1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta gratuita
3. Crea un nuevo cluster

### 2. Configurar acceso a la base de datos
1. En tu cluster, ve a "Database Access"
2. Crea un usuario de base de datos con permisos de lectura/escritura
3. En "Network Access", agrega tu IP actual o `0.0.0.0/0` para acceso desde cualquier IP (solo para desarrollo)

### 3. Obtener la cadena de conexión
1. En tu cluster, haz clic en "Connect"
2. Selecciona "Connect your application"
3. Copia la cadena de conexión

### 4. Configurar variables de entorno
Edita el archivo `.env` en la raíz del proyecto:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
DB_NAME=exchange-service
```

Reemplaza:
- `<username>`: Tu usuario de base de datos
- `<password>`: La contraseña del usuario
- `<cluster-url>`: La URL de tu cluster
- `<database-name>`: El nombre de tu base de datos (por defecto: exchange-service)

## Comandos disponibles

### Poblar la base de datos con datos iniciales
```bash
cd app
npm run seed
```

### Iniciar la aplicación
```bash
cd app
npm run start
```

## Cambios realizados

### Nuevos archivos:
- `app/models/Account.js` - Modelo de cuentas
- `app/models/Rate.js` - Modelo de tasas de cambio
- `app/models/TransactionLog.js` - Modelo de transacciones
- `app/database/connection.js` - Conexión a MongoDB
- `app/seed.js` - Script para poblar datos iniciales
- `MONGODB_MIGRATION.md` - Este archivo

### Archivos modificados:
- `app/state.js` - Refactorizado para usar MongoDB
- `app/exchange.js` - Actualizado para operaciones asíncronas
- `app/app.js` - Endpoints actualizados para async/await
- `app/package.json` - Agregadas dependencias y scripts
- `.env` - Configuración de MongoDB

### Características mantenidas:
- Misma API REST
- Misma estructura de datos
- Mismo comportamiento de negocio
- Compatibilidad con el sistema existente

### Mejoras obtenidas:
- ✅ Persistencia automática (sin schedules)
- ✅ Mejor escalabilidad
- ✅ Consistencia ACID
- ✅ Durabilidad garantizada
- ✅ Consultas más eficientes
- ✅ Backup automático (Atlas)

## Estructura de datos en MongoDB

### Colección `accounts`
```json
{
  "_id": ObjectId,
  "id": Number,
  "currency": String,
  "balance": Number,
  "createdAt": Date,
  "updatedAt": Date
}
```

### Colección `rates`
```json
{
  "_id": ObjectId,
  "baseCurrency": String,
  "counterCurrency": String,
  "rate": Number,
  "createdAt": Date,
  "updatedAt": Date
}
```

### Colección `transactionlogs`
```json
{
  "_id": ObjectId,
  "id": String,
  "ts": Date,
  "ok": Boolean,
  "request": {
    "baseCurrency": String,
    "counterCurrency": String,
    "baseAccountId": String,
    "counterAccountId": String,
    "baseAmount": Number
  },
  "exchangeRate": Number,
  "counterAmount": Number,
  "obs": String,
  "createdAt": Date,
  "updatedAt": Date
}
```