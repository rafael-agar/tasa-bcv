require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { fetchAndSaveRate } = require('../services/cronJob');

/**
 * Script manual para forzar la actualización de la tasa en la base de datos.
 */
const runManualScrape = async () => {
  try {
    console.log('🔄 Iniciando actualización manual de tasa...');
    
    // Conectar a la base de datos
    await connectDB();
    
    // Ejecutar scraping y guardado
    const result = await fetchAndSaveRate();
    
    console.log('✨ Proceso completado con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error durante la actualización manual:', error.message);
    process.exit(1);
  } finally {
    // Cerrar conexión
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

runManualScrape();
