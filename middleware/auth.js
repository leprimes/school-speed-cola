const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.cookies.token; // toma el token de la cookie
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'mi_clave_secreta');
    req.user = user; // guarda info del usuario en req.user
    next(); // pasa al siguiente middleware o ruta
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

module.exports = authenticateToken;
