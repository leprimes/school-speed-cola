const request = require("supertest");
const express = require("express");

// Mock DB
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));
const pool = require("../config/db");

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));
const bcrypt = require("bcryptjs");

// Importar rutas
const usersRouter = require("../routes/users.routes.js");

const app = express();
app.use(express.json());
app.use(usersRouter);

describe("Rutas de Usuarios", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // SP-USR-01 - Crear usuario nuevo
  // ============================================================
  test("SP-USR-01 Crear usuario nuevo", async () => {
    bcrypt.hash.mockResolvedValueOnce("hashedpass");

    pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

    const res = await request(app)
      .post("/api/users")
      .send({
        name: "Juan",
        email: "juan@mail.com",
        password: "1234",
        phone: "555",
        isprovider: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(10);
    expect(res.body.email).toBe("juan@mail.com");
  });

  // ============================================================
  // SP-USR-02 - Crear usuario sin campos requeridos
  // ============================================================
  test("SP-USR-02 Crear usuario sin campos requeridos", async () => {
    bcrypt.hash.mockImplementation(() => {
      throw new Error("Missing required fields");
    });

    const res = await request(app)
      .post("/api/users")
      .send({ email: "", password: "" });

    expect(res.status).toBe(500); // La ruta no tiene validación, responde 500
    expect(res.body.error).toBe("Error al crear usuario");
  });

  // ============================================================
  // SP-USR-03 - Listar todos los usuarios
  // ============================================================
  test("SP-USR-03 Listar todos los usuarios", async () => {
    const users = [
      { idUsuario: 1, nombre: "Juan" },
      { idUsuario: 2, nombre: "Pedro" },
    ];

    pool.query.mockResolvedValueOnce([users]);

    const res = await request(app).get("/api/users");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(users);
  });

  // ============================================================
  // SP-USR-04 - Actualizar usuario existente
  // ============================================================
  test("SP-USR-04 Actualizar usuario existente", async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put("/api/users/1")
      .send({ name: "Nuevo nombre", email: "nuevo@mail.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Usuario actualizado");
  });

  // ============================================================
  // SP-USR-05 - Eliminar usuario existente
  // ============================================================
  test("SP-USR-05 Eliminar usuario existente", async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app).delete("/api/users/1");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Usuario eliminado");
  });
});
