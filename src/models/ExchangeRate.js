const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true,
  },
  usd: {
    type: Number,
    required: true,
  },
  eur: {
    type: Number,
    required: true,
  },
  usdt: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Índice descendente por fecha para consultas de historial
exchangeRateSchema.index({ date: -1 });

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);
