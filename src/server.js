require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const ratesRouter = require('./routes/rates');
const { startCronJob } = require('./services/cronJob');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    name: 'Tasa BCV API',
    version: '1.0.0',
    description: 'API para consultar tasas de cambio del Banco Central de Venezuela (USD/EUR)',
    endpoints: {
      latest: 'GET /api/rates/latest',
      history: 'GET /api/rates/history?page=1&limit=30',
      byDate: 'GET /api/rates/date/YYYY-MM-DD',
      scrape: 'POST /api/rates/scrape',
    },
  });
});

// Rutas de la API
app.use('/api/rates', ratesRouter);

// Iniciar servidor
const start = async () => {
  // Conectar a MongoDB Atlas
  await connectDB();

  // Iniciar cron job
  startCronJob();

  app.listen(PORT, () => {
    console.log(`🚀 Tasa BCV API corriendo en http://localhost:${PORT}`);
    console.log(`📋 Documentación: http://localhost:${PORT}/`);
  });
};

start();
