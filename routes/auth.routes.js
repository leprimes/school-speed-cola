const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.use(cookieParser());

// POST - Login
router.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];
    console.log(user.contrasenia)
    // Comparar contraseña
    const validPassword = await bcrypt.compare(password, user.contrasenia);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Crear token JWT
    const token = jwt.sign(
    { 
        id: user.idUsuario,
        name: user.nombre,
        email: user.email,
        phone: user.telefono,   
        isprovider: user.rol
    },
    process.env.JWT_SECRET || 'mi_clave_secreta',
    { expiresIn: '1h' }
    );

    // Guardar token en cookie HTTP-only
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 3600000 // 1 hora
    });

    res.json({ message: 'Login exitoso', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en login' });
  }
});

// GET - Verificar sesión activa
router.get('/api/check-session', authenticateToken, (req, res) => {
  // Si el middleware pasa, significa que el usuario está logeado
  res.json({ loggedIn: true, user: req.user });
});

// GET - Obtener token de socket desde cookie
router.get("/api/socket-token", (req, res) => {
  const token = req.cookies.token; // Recupera el token guardado en la cookie
  
  if (!token) {
    return res.status(401).json({ error: "No token found" });
  }

  res.json({ token }); // Devuelve el token al frontend
});

module.exports = router;
