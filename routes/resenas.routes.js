const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// Crear reseña de proveedor (hecha por usuario)
router.post('/api/resenaProveedor', async (req, res) => {
  const { idUsuario, idProveedor, puntuacion, comentarios } = req.body;
  try {
    if (!idUsuario || !idProveedor || !puntuacion) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Insertar o actualizar reseña
    await pool.query(
      `INSERT INTO resenaProveedor (idUsuario, idProveedor, puntuacion, comentarios)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE puntuacion = VALUES(puntuacion), comentarios = VALUES(comentarios)`,
      [idUsuario, idProveedor, puntuacion, comentarios]
    );

    // Recalcular promedio de calificaciones del proveedor
    const [promedioRows] = await pool.query(
      `SELECT AVG(puntuacion) AS promedio 
       FROM resenaProveedor 
       WHERE idProveedor = ?`,
      [idProveedor]
    );

    const promedio = parseFloat(promedioRows[0].promedio || 0).toFixed(2);

    // Actualizar campo calificacion del proveedor
    await pool.query(
      `UPDATE usuarios SET calificacion = ? WHERE idUsuario = ?`,
      [promedio, idProveedor]
    );

    res.json({ message: 'Reseña de proveedor guardada y promedio actualizado', promedio });
  } catch (error) {
    console.error('Error guardando reseña de proveedor:', error);
    res.status(500).json({ error: 'Error guardando reseña de proveedor', details: error.message });
  }
});

// Crear reseña de usuario (hecha por proveedor)
router.post('/api/resenaUsuario', async (req, res) => {
  const { idProveedor, idUsuario, puntuacion, comentarios } = req.body;
  try {
    if (!idUsuario || !idProveedor || !puntuacion) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Insertar o actualizar reseña
    await pool.query(
      `INSERT INTO resenaUsuario (idProveedor, idUsuario, puntuacion, comentarios)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE puntuacion = VALUES(puntuacion), comentarios = VALUES(comentarios)`,
      [idUsuario, idProveedor, puntuacion, comentarios]
    );

    // Recalcular promedio de calificaciones del USUARIO reseñado
    const [promedioRows] = await pool.query(
      `SELECT AVG(puntuacion) AS promedio 
       FROM resenaUsuario 
       WHERE idUsuario = ?`,
      [idProveedor]
    );

    const promedio = parseFloat(promedioRows[0].promedio || 0).toFixed(2);

    // Actualizar campo calificacion en usuarios (del usuario reseñado)
    await pool.query(
      `UPDATE usuarios SET calificacion = ? WHERE idUsuario = ?`,
      [promedio, idProveedor]
    );

    res.json({ message: 'Reseña de usuario guardada y promedio actualizado', promedio });
  } catch (error) {
    console.error('Error guardando reseña de usuario:', error);
    res.status(500).json({ error: 'Error guardando reseña de usuario', details: error.message });
  }
});

// Verificar si ya existe reseña (para evitar duplicar)
router.get('/api/resena/:tipo/:idA/:idB', async (req, res) => {
  const { tipo, idA, idB } = req.params;
  try {
    let query = "";
    if (tipo === "proveedor") {
      query = "SELECT * FROM resenaProveedor WHERE idUsuario = ? AND idProveedor = ?";
    } else if (tipo === "usuario") {
      query = "SELECT * FROM resenaUsuario WHERE idProveedor = ? AND idUsuario = ?";
    } else {
      return res.status(400).json({ error: "Tipo inválido" });
    }

    const [rows] = await pool.query(query, [idA, idB]);
    res.json({ exists: rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: "Error verificando reseña", details: error.message });
  }
});

// Reseñas escritas por el usuario actual
router.get('/api/resenas/escritas/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  console.log(req.query.isProvider)
  const isProvider = Number(req.query.isProvider) === 1;
  try {
    const [rows] = isProvider
      ? await pool.query(`
          SELECT r.puntuacion, r.comentarios, u.nombre AS nombreAutor
          FROM resenaUsuario r
          JOIN usuarios u ON r.idUsuario = u.idUsuario
          WHERE r.idProveedor = ?
        `, [idUsuario])
      : await pool.query(`
          SELECT r.puntuacion, r.comentarios, p.nombre AS nombreAutor
          FROM resenaProveedor r
          JOIN usuarios p ON r.idProveedor = p.idUsuario
          WHERE r.idUsuario = ?
        `, [idUsuario]);

    console.log(rows)
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo reseñas escritas:", error);
    res.status(500).json({ error: "Error al obtener reseñas escritas" });
  }
});


// Reseñas recibidas por el usuario actual
router.get('/api/resenas/recibidas/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  const isProvider = Number(req.query.isProvider) === 1;
  console.log(req.query.isProvider)

  try {
    const [rows] = isProvider
      ? await pool.query(`
          SELECT r.puntuacion, r.comentarios, u.nombre AS nombreAutor
          FROM resenaProveedor r
          JOIN usuarios u ON r.idUsuario = u.idUsuario
          WHERE r.idProveedor = ?
        `, [idUsuario])
      : await pool.query(`
          SELECT r.puntuacion, r.comentarios, u.nombre AS nombreAutor
          FROM resenaUsuario r
          JOIN usuarios u ON r.idProveedor = u.idUsuario
          WHERE r.idUsuario = ?
        `, [idUsuario]);

    console.log(rows)
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo reseñas recibidas:", error);
    res.status(500).json({ error: "Error al obtener reseñas recibidas" });
  }
});


module.exports = router;
