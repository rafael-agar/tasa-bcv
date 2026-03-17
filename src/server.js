require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const ratesRouter = require('./routes/rates');
const { startCronJob } = require('./services/cronJob');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir la página estática de presentación
app.use(express.static(path.join(__dirname, 'public')));

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
