const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  // Si ya estamos conectados, no hacemos nada (Mongoose maneja el pool solo)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  // Prevenir que las operaciones se queden en cola si no hay conexión
  mongoose.set('bufferCommands', false);

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // No esperar más de 5s para conectar
    });
    console.log(`✅ MongoDB Atlas conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
