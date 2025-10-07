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
