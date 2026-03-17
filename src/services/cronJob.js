const cron = require('node-cron');
const scrapeBCV = require('./scraper');
const ExchangeRate = require('../models/ExchangeRate');

/**
 * Ejecuta el scraping y guarda la tasa en la base de datos.
 */
const fetchAndSaveRate = async () => {
  try {
    const { usd, eur, date } = await scrapeBCV();

    // Upsert: actualizar si ya existe la tasa de hoy, o crear nueva
    const result = await ExchangeRate.findOneAndUpdate(
      { date },
      { usd, eur, date },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Tasa guardada — Fecha: ${result.date.toISOString().split('T')[0]} | USD: ${result.usd} | EUR: ${result.eur}`);
    return result;
  } catch (error) {
    console.error(`❌ Error al guardar tasa: ${error.message}`);
    throw error;
  }
};

/**
 * Inicia el cron job que se ejecuta todos los días a las 4:00 PM hora de Caracas.
 */
const startCronJob = () => {
  // Cron: minuto 0, hora 16, todos los días, todos los meses, lunes a viernes
  // Timezone: America/Caracas (UTC-4)
  const task = cron.schedule('0 16 * * 1-5', async () => {
    console.log('⏰ Ejecutando scraping programado (4:00 PM Caracas)...');
    await fetchAndSaveRate();
  }, {
    scheduled: true,
    timezone: 'America/Caracas',
  });

  console.log('🕐 Cron job programado: Lunes a Viernes a las 4:00 PM (America/Caracas)');
  return task;
};

module.exports = { startCronJob, fetchAndSaveRate };
