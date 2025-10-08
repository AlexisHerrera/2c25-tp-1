# Setup de Variables de Entorno

## Configuración Inicial

1. **Copia el archivo de ejemplo de variables de entorno:**

   ```bash
   cp .env.example .env
   ```

2. **Edita el archivo `.env` con tus credenciales reales:**

   ```bash
   # Reemplaza 'your_mongodb_connection_string_here' con tu URI real de MongoDB
   MONGODB_URI=mongodb+srv://tu_usuario:tu_password@tu_cluster.mongodb.net/?retryWrites=true&w=majority&appName=tuApp
   DB_NAME=exchange-service
   NODE_ENV=development
   ```

3. **Nunca commits el archivo `.env` al repositorio**
   - El archivo `.env` está incluido en `.gitignore`
   - Solo commitear `.env.example` con valores de ejemplo

## Ejecución

```bash
# Iniciar los servicios
docker compose up --build

# Detener los servicios
docker compose down
```

## Seguridad

- ✅ Variables sensibles están en `.env` (no commiteado)
- ✅ Archivo `.env.example` contiene plantilla sin credenciales reales
- ✅ `.gitignore` protege archivos `.env`

## Uso de MongoDB local (opcional)

Este repositorio ahora incluye un servicio `mongo` en `docker-compose.yml` para desarrollo local.

- La aplicación `api` fue configurada para usar `MONGODB_URI=mongodb://mongo:27017` cuando se levanta con Docker Compose.
- Para usar la base local simplemente corre:

```bash
docker compose up --build
```

El contenedor de Mongo expone el puerto `27017` en el host (localhost:27017) y persiste datos en el volumen `mongo_data`.

Si prefieres usar tu propio Atlas/servicio en la nube, restaura la variable `MONGODB_URI` en tu archivo `.env` con la cadena remota.
