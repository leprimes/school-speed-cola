const express = require('express');
const NodeCache = require('node-cache');
const pool = require('../config/db');
const router = express.Router();

const cache = new NodeCache();

// ============================================================
// SP-SRV-01 – LISTAR SERVICIOS
// ============================================================
router.get('/api/services', async (req, res) => {
  try {
    const cachedServices = cache.get('services');
    if (cachedServices) {
      return res.status(200).json(cachedServices);
    }

    const [rows] = await pool.query('SELECT * FROM servicios');
    cache.set('services', rows);
    res.status(200).json(rows);

  } catch (error) {
    res.status(500).json({ error: 'Error al mostrar servicios' });
  }
});

// ============================================================
// SP-SRV-02 / SP-SRV-03 – CREAR SERVICIO
// ============================================================
router.post('/api/services', async (req, res) => {
  try {
    const { nombre, descripcion, precio, duracionEstimada, imagen, idCategoria, email } = req.body;

    if (!nombre || !precio || !duracionEstimada || !idCategoria) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Obtener idUsuario desde email
    const [users] = await pool.query(
      'SELECT idUsuario FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const idUsuario = users[0].idUsuario;

    // Insertar servicio
    const [result] = await pool.query(
      'INSERT INTO servicios (nombre, descripcion, precio, duracionEstimada, imagen, idUsuario, idCategoria) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, descripcion, precio, duracionEstimada, imagen, idUsuario, idCategoria]
    );

    return res.status(201).json({
      id: result.insertId,
      nombre,
      descripcion,
      precio,
      duracionEstimada,
      imagen,
      idCategoria,
      idUsuario
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

// ============================================================
// SP-SRV-04 – SERVICIO POR ID
// ============================================================
router.get('/api/services/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(`
        SELECT 
          s.idServicio, 
          s.idUsuario,
          s.nombre AS nombreServicio, 
          s.descripcion, 
          s.precio, 
          s.duracionEstimada, 
          s.imagen, 
          s.idCategoria, 
          u.nombre AS nombreProveedor, 
          u.calificacion AS ratingProveedor,
          c.descripcion AS nombreCategoria
        FROM servicios s
        LEFT JOIN usuarios u ON s.idUsuario = u.idUsuario
        LEFT JOIN categoria c ON s.idCategoria = c.idCategoria
        WHERE s.idServicio = ?
      `, [id]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Service not found" });

    return res.status(200).json(rows[0]);

  } catch (error) {
    res.status(500).json({ message: 'Error fetching service' });
  }
});

// ============================================================
// SP-SRV-05 – ACTUALIZAR SERVICIO
// ============================================================
router.put('/api/services/:id', async (req, res) => {
  try {
    const { nombre, descripcion, precio, duracionEstimada, imagen, idCategoria } = req.body;
    const { id } = req.params;

    if (!nombre || !precio || !duracionEstimada || !idCategoria) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.query(
      `UPDATE servicios 
       SET nombre=?, descripcion=?, precio=?, duracionEstimada=?, imagen=?, idCategoria=?
       WHERE idServicio=?`,
      [nombre, descripcion, precio, duracionEstimada, imagen, idCategoria, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Service not found" });

    res.status(200).json({ message: "Service updated successfully" });

  } catch (error) {
    res.status(500).json({ error: 'Error updating service' });
  }
});

// ============================================================
// SP-SRV-06 – ELIMINAR SERVICIO
// ============================================================
router.delete('/api/services/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM servicios WHERE idServicio = ?', [req.params.id]);
    res.status(200).json({ message: 'Servicio eliminado' });

  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// ============================================================
// SP-SRV-07 – LISTAR SERVICIOS CON USUARIO
// ============================================================
router.get('/api/servicesUsers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT  
        s.idServicio,
        s.nombre AS nombreServicio,
        s.descripcion,
        s.precio,
        s.duracionEstimada,
        s.imagen,
        s.idCategoria,
        u.nombre AS nombreProveedor,
        u.calificacion AS ratingProveedor,
        c.descripcion AS nombreCategoria
      FROM servicios s
      JOIN usuarios u ON s.idUsuario = u.idUsuario
      JOIN categoria c ON s.idCategoria = c.idCategoria
    `);

    res.status(200).json(rows);

  } catch (error) {
    res.status(500).json({ error: 'Error al mostrar servicios' });
  }
});

// ============================================================
// SP-SRV-08 – TOP 3 SERVICIOS
// ============================================================
router.get('/api/servicesIndex', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT  
        s.idServicio,
        s.nombre AS nombreServicio,
        s.descripcion,
        s.precio,
        s.duracionEstimada,
        s.imagen,
        s.idCategoria,
        u.nombre AS nombreProveedor,
        u.calificacion AS ratingProveedor,
        c.descripcion AS nombreCategoria
      FROM servicios s
      JOIN usuarios u ON s.idUsuario = u.idUsuario
      JOIN categoria c ON s.idCategoria = c.idCategoria
      ORDER BY s.precio ASC
      LIMIT 3
    `);

    res.status(200).json(rows);

  } catch (error) {
    res.status(500).json({ error: 'Error al mostrar servicios destacados' });
  }
});

// ============================================================
// SP-SRV-09 – SERVICIOS DE PROVEEDOR POR EMAIL
// ============================================================
router.get('/api/serviceProv/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const [rows] = await pool.query(`
      SELECT 
        s.idServicio, 
        s.nombre AS nombreServicio, 
        s.descripcion, 
        s.precio, 
        s.duracionEstimada, 
        s.imagen, 
        s.idCategoria, 
        u.nombre AS nombreProveedor, 
        u.calificacion AS ratingProveedor, 
        c.descripcion AS nombreCategoria
      FROM servicios s
      JOIN usuarios u ON s.idUsuario = u.idUsuario
      JOIN categoria c ON s.idCategoria = c.idCategoria
      WHERE u.email = ?
    `, [email]);

    if (rows.length === 0)
      return res.status(404).json({ message: "El proveedor no tiene servicios" });

    return res.status(200).json(rows[0]);

  } catch (error) {
    res.status(500).json({ message: 'Error fetching service' });
  }
});


module.exports = router;
