const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// GET - Obtener todos los chats de un proveedor
router.get('/api/chats/provider/:providerId', async (req, res) => {
  try {
    const providerId = parseInt(req.params.providerId);
    
    const [chats] = await pool.query(
      `SELECT 
        c.idChat,
        c.idCliente,
        c.idProveedor,
        cliente.nombre AS nombreCliente,
        cliente.fotoPerfil AS fotoCliente,
        cliente.email AS emailCliente,
        (SELECT m.contenido 
         FROM mensajes m 
         WHERE m.idChat = c.idChat 
         ORDER BY m.timestampEnvio DESC 
         LIMIT 1) AS ultimoMensaje,
        (SELECT m.timestampEnvio 
         FROM mensajes m 
         WHERE m.idChat = c.idChat 
         ORDER BY m.timestampEnvio DESC 
         LIMIT 1) AS fechaUltimoMensaje
      FROM chats c
      JOIN usuarios cliente ON c.idCliente = cliente.idUsuario
      WHERE c.idProveedor = ?
      ORDER BY fechaUltimoMensaje DESC`,
      [providerId, providerId]
    );
    
    res.json(chats);
  } catch (error) {
    console.error('Error obteniendo chats del proveedor:', error);
    res.status(500).json({ error: 'Error al obtener chats' });
  }
});

// GET - Obtener todos los chats de un cliente
router.get('/api/chats/client/:clientId', async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    
    const [chats] = await pool.query(
      `SELECT 
        c.idChat,
        c.idCliente,
        c.idProveedor,
        proveedor.nombre AS nombreProveedor,
        proveedor.fotoPerfil AS fotoProveedor,
        proveedor.email AS emailProveedor,
        (SELECT m.contenido 
         FROM mensajes m 
         WHERE m.idChat = c.idChat 
         ORDER BY m.timestampEnvio DESC 
         LIMIT 1) AS ultimoMensaje,
        (SELECT m.timestampEnvio 
         FROM mensajes m 
         WHERE m.idChat = c.idChat 
         ORDER BY m.timestampEnvio DESC 
         LIMIT 1) AS fechaUltimoMensaje
      FROM chats c
      JOIN usuarios proveedor ON c.idProveedor = proveedor.idUsuario
      WHERE c.idCliente = ?
      ORDER BY fechaUltimoMensaje DESC`,
      [clientId, clientId]
    );
    
    res.json(chats);
  } catch (error) {
    console.error('Error obteniendo chats del cliente:', error);
    res.status(500).json({ error: 'Error al obtener chats' });
  }
});

module.exports = router;
