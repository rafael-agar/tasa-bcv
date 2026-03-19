const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// El BCV tiene problemas con su certificado SSL,
// se ignora la verificación ya que es un sitio público del gobierno.
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Lógica interna para hacer el scraping de la página del BCV y Binance.
 * @returns {Promise<{ usd: number, eur: number, usdt: number, date: Date }>}
 */
const performScraping = async () => {
  const { data: html } = await axios.get('https://www.bcv.org.ve/', {
    httpsAgent,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: 15000,
  });

  const $ = cheerio.load(html);

  let usd = null;
  let eur = null;

  // Recorrer cada recuadro de tasa de cambio
  $('div.recuadrotsmc').each((_, element) => {
    const currencyText = $(element).find('span').text().trim().toUpperCase();
    const valueText = $(element).find('div.col-sm-6.centrado strong').text().trim();

    if (!valueText) return;

    // Convertir formato venezolano: "514,97823921" → 514.97823921
    // El BCV usa punto como separador de miles y coma como decimal
    const numericValue = parseFloat(
      valueText.replace(/\./g, '').replace(',', '.')
    );

    if (isNaN(numericValue)) return;

    if (currencyText.includes('USD')) {
      usd = numericValue;
    } else if (currencyText.includes('EUR')) {
      eur = numericValue;
    }
  });

  if (usd === null || eur === null) {
    throw new Error('No se pudieron extraer las tasas del BCV. La estructura HTML pudo haber cambiado.');
  }

  // Obtener USDT desde la API de Binance P2P
  let usdt = null;
  try {
    const { data: binanceData } = await axios.post(
      'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
      {
        fiat: 'VES',
        page: 1,
        rows: 1,
        tradeType: 'BUY',
        asset: 'USDT',
        countries: [],
        proMerchantAds: false,
        publisherType: null,
        payTypes: []
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        timeout: 10000,
      }
    );
    if (binanceData?.data?.[0]?.adv?.price) {
      usdt = parseFloat(binanceData.data[0].adv.price);
    }
  } catch (err) {
    console.error(`⚠️ Error extrayendo Binance P2P: ${err.message}`);
    // Fallback: usar el mismo valor que USD para que no falle todo el proceso
    usdt = usd;
  }

  // Fecha de hoy sin hora (solo el día)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log(`📊 Tasas obtenidas — USD: ${usd} | EUR: ${eur} | USDT: ${usdt}`);

  return { usd, eur, usdt, date: today };
};

/**
 * Función principal que llama a la lógica de scraping y reintenta cada 10 min si falla.
 * El máximo de intentos se basa en el próximo cron programado.
 */
const scrapeBCV = async () => {
  // Calcular intentos máximos: 1 intento cada 10 min -> 6 por hora
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Por defecto (lunes a jueves) el próximo scraping es en 24 horas
  let maxAttempts = 24 * 6; // 144 intentos
  
  // Si es viernes (5), el próximo scraping es el lunes, o sea en 72 horas
  if (dayOfWeek === 5) {
    maxAttempts = 72 * 6; // 432 intentos
  }

  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      return await performScraping();
    } catch (error) {
      attempt++;
      console.error(`❌ Error en scraping del BCV: ${error.message}`);
      
      if (attempt < maxAttempts) {
        console.log(`⏳ Reintentando en 10 minutos... (Intento ${attempt} de ${maxAttempts})`);
        // Esperar 10 minutos (600,000 milisegundos)
        await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));
      } else {
        console.error(`🚨 Se alcanzó el límite máximo de intentos (${maxAttempts}) hasta el próximo scraping programado.`);
        throw error;
      }
    }
  }
};

module.exports = scrapeBCV;

// Permitir ejecución directa para pruebas: node src/services/scraper.js
if (require.main === module) {
  (async () => {
    try {
      console.log('🧪 Iniciando prueba de scraping manual...');
      const result = await performScraping(); // Usamos performScraping para una sola ejecución rápida
      console.log('✅ Prueba exitosa:', result);
      process.exit(0);
    } catch (error) {
      console.error('❌ Error en la prueba de scraping:', error.message);
      process.exit(1);
    }
  })();
}
