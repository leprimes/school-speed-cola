const express = require('express');
const pool = require('../config/db');
const NodeCache = require('node-cache');

const router = express.Router();

//Crear instancia de cache con TTL de 2 minutos
const cache = new NodeCache({ stdTTL: 120, checkperiod: 150 });

// GET - Obtener todas las categorías con cache
router.get('/api/categories', async (req, res) => {
  try {
    const cacheKey = 'categories';

    //Buscar en caché
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Cache hit: /api/categories');
      return res.json(cachedData);
    }

    // Si no existe en caché, consultar DB
    console.log('Cache miss: /api/categories');
    const [rows] = await pool.query('SELECT * FROM categoria');

    // Guardar en caché
    cache.set(cacheKey, rows);
    console.log('Data guardada en caché');

    res.json(rows);
  } catch (error) {
    console.error('Error al mostrar Categorías:', error);
    res.status(500).json({ error: 'Error al mostrar Categorías', details: error.message });
  }
});

module.exports = router;
