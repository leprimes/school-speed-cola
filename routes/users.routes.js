const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getPool } = require("../config/db");
const router = express.Router();

// GET - Obtener todos los usuarios
router.get("/api/users", async (req, res) => {
  try {
    const pool = getPool();

    const [rows] = await pool.query("SELECT * FROM usuarios");
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener usuarios", details: error.message });
  }
});

// POST - Crear usuario
router.post("/api/users", async (req, res) => {
  try {
    const pool = getPool();

    const { name, isprovider, email, password, phone, foto } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, email, contrasenia, telefono, rol, fotoPerfil) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, phone, isprovider, foto],
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al crear usuario", details: error.message });
  }
});

// PUT - Actualizar usuario
router.put("/api/users/:id", async (req, res) => {
  try {
    const pool = getPool();

    const { nombre, email, telefono } = req.body;

    await pool.query(
      "UPDATE usuarios SET nombre=?, email=?, telefono=? WHERE idUsuario=?",
      [nombre, email, telefono, req.params.id],
    );

    // Obtener usuario actualizado
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE idUsuario=?",
      [req.params.id],
    );

    const user = rows[0];

    // Crear nuevo token
    const newToken = jwt.sign(
      {
        id: user.idUsuario,
        name: user.nombre,
        email: user.email,
        phone: user.telefono,
        isprovider: user.rol,
      },
      process.env.JWT_SECRET || "mi_clave_secreta",
      { expiresIn: "1h" },
    );

    // Guardar nuevo token en cookie
    res.cookie("token", newToken, {
      httpOnly: true,
      secure: false,
      maxAge: 3600000,
    });

    res.json({ message: "Usuario actualizado", updatedUser: user });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al actualizar usuario", details: error.message });
  }
});

// DELETE - Eliminar usuario
router.delete("/api/users/:id", async (req, res) => {
  try {
    const pool = getPool();
    await pool.query("DELETE FROM usuarios WHERE idUsuario=?", [req.params.id]);
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al eliminar usuario", details: error.message });
  }
});

module.exports = router;
