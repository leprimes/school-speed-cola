const express = require("express");
const NodeCache = require("node-cache");
const { getPool } = require("../config/db");
const authenticateToken = require("../middleware/auth");
const router = express.Router();

const cache = new NodeCache();

// ============================================================
// SP-SRV-01 – LISTAR SERVICIOS
// ============================================================
router.get("/api/services", async (req, res) => {
  try {
    const pool = getPool();
    const cachedServices = cache.get("services");
    if (cachedServices) {
      return res.status(200).json(cachedServices);
    }

    const [rows] = await pool.query("SELECT * FROM servicios");
    cache.set("services", rows);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al mostrar servicios" });
  }
});

// ============================================================
// SP-SRV-02 / SP-SRV-03 – CREAR SERVICIO
// ============================================================
router.post("/api/services", authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const {
      nombre,
      descripcion,
      precio,
      duracionEstimada,
      imagen,
      idCategoria,
    } = req.body;

    const precioNum = Number(precio);
    const categoriaNum = Number(idCategoria);

    if (
      !nombre ||
      !Number.isFinite(precioNum) ||
      !duracionEstimada ||
      !Number.isInteger(categoriaNum)
    ) {
      return res.status(400).json({
        error: "Missing/invalid required fields",
        received: { nombre, precio, duracionEstimada, idCategoria },
      });
    }

    const idUsuario = req.user?.id;
    if (!idUsuario) {
      return res.status(401).json({ error: "No autorizado" });
    }
    if (!req.user?.isprovider) {
      return res.status(403).json({ error: "Solo proveedores" });
    }

    const [result] = await pool.query(
      "INSERT INTO servicios (nombre, descripcion, precio, duracionEstimada, imagen, idUsuario, idCategoria) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        nombre,
        descripcion,
        precioNum,
        duracionEstimada,
        imagen,
        idUsuario,
        categoriaNum,
      ],
    );

    return res.status(201).json({
      id: result.insertId,
      nombre,
      descripcion,
      precio,
      duracionEstimada,
      imagen,
      idCategoria,
      idUsuario,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al crear servicio" });
  }
});

// ============================================================
// SP-SRV-04 – SERVICIO POR ID
// ============================================================
router.get("/api/services/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `
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
      `,
      [id],
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Service not found" });

    return res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error fetching service" });
  }
});

// ============================================================
// SP-SRV-05 – ACTUALIZAR SERVICIO
// ============================================================
router.put("/api/services/:id", authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const {
      nombre,
      descripcion,
      precio,
      duracionEstimada,
      imagen,
      idCategoria,
    } = req.body;
    const { id } = req.params;

    if (!nombre || !precio || !duracionEstimada || !idCategoria) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const idUsuario = req.user?.id;
    if (!idUsuario) {
      return res.status(401).json({ error: "No autorizado" });
    }
    if (!req.user?.isprovider) {
      return res.status(403).json({ error: "Solo proveedores" });
    }

    const [result] = await pool.query(
      `UPDATE servicios 
       SET nombre=?, descripcion=?, precio=?, duracionEstimada=?, imagen=?, idCategoria=?
       WHERE idServicio=? AND idUsuario=?`,
      [
        nombre,
        descripcion,
        precio,
        duracionEstimada,
        imagen,
        idCategoria,
        id,
        idUsuario,
      ],
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Service not found" });

    res.status(200).json({ message: "Service updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating service" });
  }
});

// ============================================================
// SP-SRV-06 – ELIMINAR SERVICIO
// ============================================================
router.delete("/api/services/:id", authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const idUsuario = req.user?.id;
    if (!idUsuario) {
      return res.status(401).json({ error: "No autorizado" });
    }
    if (!req.user?.isprovider) {
      return res.status(403).json({ error: "Solo proveedores" });
    }

    const [result] = await pool.query(
      "DELETE FROM servicios WHERE idServicio = ? AND idUsuario = ?",
      [req.params.id, idUsuario],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    res
      .status(200)
      .json({ message: "Servicio eliminado", deletedId: req.params.id });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al eliminar", details: error.message });
  }
});

// ============================================================
// SP-SRV-07 – LISTAR SERVICIOS CON USUARIO
// ============================================================
router.get("/api/servicesUsers", async (req, res) => {
  try {
    const pool = getPool();
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
    res.status(500).json({ error: "Error al mostrar servicios" });
  }
});

// ============================================================
// SP-SRV-08 – TOP 3 SERVICIOS
// ============================================================
router.get("/api/servicesIndex", async (req, res) => {
  try {
    const pool = getPool();
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
    res.status(500).json({ error: "Error al mostrar servicios destacados" });
  }
});

// ============================================================
// SP-SRV-09 – SERVICIOS DE PROVEEDOR POR EMAIL
// ============================================================
router.get("/api/serviceProv/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `
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
    `,
      [email],
    );

    if (rows.length === 0)
      return res
        .status(404)
        .json({ message: "El proveedor no tiene servicios" });

    return res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching service" });
  }
});

// ============================================================
// SP-SRV-10 – LISTAR SERVICIOS DEL PROVEEDOR AUTENTICADO
// ============================================================

router.get("/api/my-services", authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const idUsuario = req.user?.id;
    if (!idUsuario) return res.status(401).json({ error: "No autorizado" });
    if (!req.user?.isprovider)
      return res.status(403).json({ error: "Solo proveedores" });

    const [rows] = await pool.query(
      `
        SELECT 
          s.idServicio,
          s.nombre AS nombreServicio,
          s.descripcion,
          s.precio,
          s.duracionEstimada,
          s.imagen,
          s.idCategoria,
          c.descripcion AS nombreCategoria,
          u.calificacion AS ratingProveedor
        FROM servicios s
        JOIN categoria c ON s.idCategoria = c.idCategoria
        JOIN usuarios u ON s.idUsuario = u.idUsuario
        WHERE s.idUsuario = ?
      `,
      [idUsuario],
    );

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al mostrar servicios" });
  }
});

module.exports = router;
