const express = require('express');
const router = express.Router();
const ExchangeRate = require('../models/ExchangeRate');
const { fetchAndSaveRate } = require('../services/cronJob');

/**
 * GET /api/rates/latest
 * Obtener la última tasa registrada.
 */
router.get('/latest', async (req, res) => {
  try {
    const latest = await ExchangeRate.findOne().sort({ date: -1 });

    if (!latest) {
      return res.status(404).json({
        success: false,
        message: 'No hay tasas registradas. Ejecuta POST /api/rates/scrape para obtener la primera.',
      });
    }

    res.json({
      success: true,
      data: {
        date: latest.date.toISOString().split('T')[0],
        usd: latest.usd,
        eur: latest.eur,
        usdt: latest.usdt,
        updatedAt: latest.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/rates/history
 * Obtener historial de tasas con paginación.
 * Query params: ?page=1&limit=30
 */
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [rates, total] = await Promise.all([
      ExchangeRate.find().sort({ date: -1 }).skip(skip).limit(limit),
      ExchangeRate.countDocuments(),
    ]);

    res.json({
      success: true,
      data: rates.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        usd: r.usd,
        eur: r.eur,
        usdt: r.usdt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/rates/date/:date
 * Obtener tasa de una fecha específica (formato YYYY-MM-DD).
 */
router.get('/date/:date', async (req, res) => {
  try {
    const dateParam = new Date(req.params.date);

    if (isNaN(dateParam.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido. Usa YYYY-MM-DD.',
      });
    }

    dateParam.setHours(0, 0, 0, 0);

    const rate = await ExchangeRate.findOne({ date: dateParam });

    if (!rate) {
      return res.status(404).json({
        success: false,
        message: `No se encontró tasa para la fecha ${req.params.date}.`,
      });
    }

    res.json({
      success: true,
      data: {
        date: rate.date.toISOString().split('T')[0],
        usd: rate.usd,
        eur: rate.eur,
        usdt: rate.usdt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/rates/scrape
 * Ejecutar scraping manual on-demand.
 */
router.post('/scrape', async (req, res) => {
  try {
    const result = await fetchAndSaveRate();

    res.json({
      success: true,
      message: 'Scraping ejecutado correctamente.',
      data: {
        date: result.date.toISOString().split('T')[0],
        usd: result.usd,
        eur: result.eur,
        usdt: result.usdt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
