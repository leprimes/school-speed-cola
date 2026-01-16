const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.post('/api/citas', async (req, res) => {
  try {

    const {fecha, idCliente, idProveedor, idServicio, costo, especificaciones} = req.body;
    
    // Validar entrada
    if (!fecha || !idCliente || !idProveedor || !idServicio || !costo || !especificaciones) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { fecha, idCliente, idProveedor, idServicio, costo, especificaciones }
      });
    }

    let estado = "pendiente"

    const [result] = await pool.query(
      'INSERT INTO citas (fecha, idCliente, idProveedor, idServicio, estado) VALUES (?, ?, ?, ?, ?)',
      [fecha, idCliente, idProveedor, idServicio, estado]
    );
    
    console.log("cita created with ID:", result.insertId);
    
    res.status(201).json({ 
      id: result.insertId, 
      fecha, 
      idCliente, 
      idProveedor, 
      idServicio, 
      estado
    });

  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ error: 'Error al crear la cita', details: error.message });
  }
});

router.post('/api/contrato', async (req, res) => {
    try {

    const {idCita, fecha, idCliente, idProveedor, idServicio, costo, especificaciones} = req.body;
    
    // Validar entrada
    if (!idCita || !fecha || !idCliente || !idProveedor || !idServicio || !costo || !especificaciones) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { fecha, idCliente, idProveedor, idServicio, costo, especificaciones }
      });
    }

    const [result] = await pool.query(
        'INSERT INTO contrato (idCita, fecha, idCliente, idProveedor, idServicio, costo, especificaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [idCita, fecha, idCliente, idProveedor, idServicio, costo, especificaciones]
    )
    
    console.log("contrato created with ID:", result.insertId);
    
    res.status(201).json({ 
      id: result.insertId, 
      idCita,
      fecha, 
      idCliente, 
      idProveedor, 
      idServicio, 
      costo,
      especificaciones
    });

  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ error: 'Error al crear el contrato', details: error.message });
  }

});

// Obtener citas por usuario (cliente o proveedor)
router.get('/api/citas/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT c.*, 
              u1.nombre AS nombreCliente, 
              u2.nombre AS nombreProveedor,
              s.nombre AS nombreServicio
       FROM citas c
       JOIN usuarios u1 ON c.idCliente = u1.idUsuario
       JOIN usuarios u2 ON c.idProveedor = u2.idUsuario
       JOIN servicios s ON c.idServicio = s.idServicio
       WHERE c.idCliente = ? OR c.idProveedor = ?
       ORDER BY c.fecha DESC
       LIMIT 10`,
      [idUsuario, idUsuario]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener citas', details: error.message });
  }
});

router.put('/api/citas/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    // Si el nuevo estado es "cancelado", borrar el contrato asociado
    if (estado === 'cancelado') {
      await pool.query('DELETE FROM contrato WHERE idCita = ?', [id]);
    }

    // Actualizar estado en la cita
    const [result] = await pool.query(
      'UPDATE citas SET estado = ? WHERE idCita = ?',
      [estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.json({ message: `Estado de cita cambiado a ${estado}` });
  } catch (error) {
    console.error("Error al actualizar cita:", error);
    res.status(500).json({ error: 'Error al actualizar cita', details: error.message });
  }
});

// Obtener contratos por usuario
router.get('/api/contratos/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT ct.*, 
              u1.nombre AS nombreCliente, 
              u2.nombre AS nombreProveedor,
              s.nombre AS nombreServicio,
              c.estado AS estadoCita,
              c.fecha AS fechaCita
       FROM contrato ct
       JOIN usuarios u1 ON ct.idCliente = u1.idUsuario
       JOIN usuarios u2 ON ct.idProveedor = u2.idUsuario
       JOIN servicios s ON ct.idServicio = s.idServicio
       JOIN citas c ON ct.idCita = c.idCita
       WHERE ct.idCliente = ? OR ct.idProveedor = ?
       ORDER BY 
        CASE 
          WHEN c.estado = 'activo' THEN 1 
          ELSE 2 
        END,
       c.fecha DESC`,
      [idUsuario, idUsuario]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error al obtener contratos:", error);
    res.status(500).json({ error: 'Error al obtener contratos', details: error.message });
  }
});


module.exports = router;