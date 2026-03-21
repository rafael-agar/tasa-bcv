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

// Servir la página estática de presentación (ahora en la raíz)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas de la API
app.use('/api/rates', ratesRouter);

// Exportar app para Vercel
module.exports = app;

// Iniciar servidor localmente si no es un entorno serverless
if (!process.env.VERCEL) {
  const start = async () => {
    try {
      await connectDB();
      startCronJob();
      app.listen(PORT, () => {
        console.log(`🚀 Tasa BCV API corriendo en http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('❌ Error al iniciar el servidor:', error.message);
    }
  };
  start();
} else {
  // En Vercel, nos aseguramos de conectar a DB en cada función (Mongoose maneja el pool internamente)
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Database connection error' });
    }
  });
}
