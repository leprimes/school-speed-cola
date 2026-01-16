const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

// Mock DB
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));
const pool = require("../config/db");

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));
const bcrypt = require("bcryptjs");

// Mock JWT
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));
const jwt = require("jsonwebtoken");

// Mock middleware authenticateToken
jest.mock("../middleware/auth", () =>
  jest.fn((req, res, next) => {
    req.user = { id: 1, name: "Juan", email: "juan@mail.com" };
    next();
  })
);
const authenticateToken = require("../middleware/auth");

// Import router
const authRouter = require("../routes/auth.routes.js");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(authRouter);

describe("Rutas de Autenticación", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // SP-AUT-01 - Login exitoso
  // ============================================================
  test("SP-AUT-01 Login exitoso", async () => {
    const fakeUser = {
      idUsuario: 10,
      nombre: "Usuario Test",
      email: "usuario@dominio.com",
      telefono: "123456789",
      rol: 1,
      contrasenia: "hashedpass",
    };

    pool.query.mockResolvedValueOnce([[fakeUser]]);
    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValueOnce("FAKE_TOKEN");

    const res = await request(app)
      .post("/api/login")
      .send({ email: "usuario@dominio.com", password: "12345" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login exitoso");
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(jwt.sign).toHaveBeenCalled();
  });

  // ============================================================
  // SP-AUT-02 - Contraseña incorrecta
  // ============================================================
  test("SP-AUT-02 Login contraseña incorrecta", async () => {
    pool.query.mockResolvedValueOnce([
      [{ contrasenia: "hashedpass" }],
    ]);
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post("/api/login")
      .send({ email: "usuario@dominio.com", password: "errada" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Contraseña incorrecta");
  });

  // ============================================================
  // SP-AUT-03 - Usuario inexistente
  // ============================================================
  test("SP-AUT-03 Login usuario inexistente", async () => {
    pool.query.mockResolvedValueOnce([[]]); // Empty rows

    const res = await request(app)
      .post("/api/login")
      .send({ email: "noexiste@mail.com", password: "12345" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Usuario no encontrado");
  });

  // ============================================================
  // SP-AUT-04 - Verificar sesión activa
  // ============================================================
  test("SP-AUT-04 Verificar sesión activa", async () => {
    const res = await request(app).get("/api/check-session");

    expect(authenticateToken).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.loggedIn).toBe(true);
    expect(res.body.user.email).toBe("juan@mail.com");
  });

  // ============================================================
  // SP-AUT-05 - Obtener token de socket con cookie
  // ============================================================
  test("SP-AUT-05 Obtener token socket con sesión", async () => {
    const res = await request(app)
      .get("/api/socket-token")
      .set("Cookie", ["token=FAKE_TOKEN"]);

    expect(res.status).toBe(200);
    expect(res.body.token).toBe("FAKE_TOKEN");
  });

  // ============================================================
  // SP-AUT-06 - Obtener token sin sesión
  // ============================================================
  test("SP-AUT-06 Obtener token sin sesión", async () => {
    const res = await request(app).get("/api/socket-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No token found");
  });
});
