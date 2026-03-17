# 🇻🇪 Tasa BCV API

API en Node.js que obtiene las tasas de cambio oficiales del **Banco Central de Venezuela** (USD y EUR) mediante scraping de [bcv.org.ve](https://www.bcv.org.ve/), las almacena en **MongoDB Atlas** con historial infinito, y se actualiza automáticamente de lunes a viernes a las **4:00 PM hora de Caracas**.

## 🚀 Instalación

```bash
# Clonar e instalar dependencias
cd tasaBCV
npm install
```

## ⚙️ Configuración

1. Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

2. Configura tu URI de **MongoDB Atlas** en `.env`:

```
PORT=3000
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/tasaBCV?retryWrites=true&w=majority
```

## ▶️ Ejecución

```bash
# Producción
npm start

# Desarrollo (auto-reload)
npm run dev
```

## 📡 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Info de la API |
| `GET` | `/api/rates/latest` | Última tasa registrada |
| `GET` | `/api/rates/history?page=1&limit=30` | Historial con paginación |
| `GET` | `/api/rates/date/YYYY-MM-DD` | Tasa por fecha específica |
| `POST` | `/api/rates/scrape` | Ejecutar scraping manualmente |

## 📦 Ejemplo de respuesta

```json
{
  "success": true,
  "data": {
    "date": "2026-03-16",
    "usd": 448.36860000,
    "eur": 514.97823921
  }
}
```

## ⏰ Cron Job

El scraping se ejecuta automáticamente **de lunes a viernes a las 4:00 PM** hora de Caracas (`America/Caracas`). También puedes ejecutarlo manualmente con `POST /api/rates/scrape`.
