const request = require("supertest");
const express = require("express");

// Mock DB
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));
const pool = require("../config/db");

// Import router
const resenasRouter = require("../routes/resenas.routes.js"); // Ajusta si tu archivo se llama distinto

const app = express();
app.use(express.json());
app.use(resenasRouter);

describe("Reseñas (Proveedor / Usuario)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // SP-RES-01 - Crear reseña de proveedor
  // ============================================================
  test("SP-RES-01 Crear reseña de proveedor", async () => {
    
    pool.query.mockResolvedValueOnce([{}]);
    pool.query.mockResolvedValueOnce([[{ promedio: 5 }]]);
    pool.query.mockResolvedValueOnce([{}]);

    const res = await request(app)
      .post("/api/resenaProveedor")
      .send({
        idUsuario: 1,
        idProveedor: 2,
        puntuacion: 5,
        comentarios: "Excelente"
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Reseña de proveedor guardada");
    expect(res.body.promedio).toBe("5.00");
  });

  // ============================================================
  // SP-RES-02 - Crear reseña de usuario
  // ============================================================
  test("SP-RES-02 Crear reseña de usuario", async () => {
    
    pool.query.mockResolvedValueOnce([{}]);
    pool.query.mockResolvedValueOnce([[{ promedio: 4 }]]);
    pool.query.mockResolvedValueOnce([{}]);

    const res = await request(app)
      .post("/api/resenaUsuario")
      .send({
        idProveedor: 2,
        idUsuario: 1,
        puntuacion: 4
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Reseña de usuario guardada");
    expect(res.body.promedio).toBe("4.00");
  });

  // ============================================================
  // SP-RES-03 - Verificar reseña existente
  // ============================================================
  test("SP-RES-03 Verificar reseña existente", async () => {
    const fakeRows = [{}]; // existe reseña

    pool.query.mockResolvedValueOnce([fakeRows]);

    const res = await request(app).get("/api/resena/proveedor/1/2");

    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(true);
  });

  // ============================================================
  // SP-RES-04 - Listar reseñas escritas por usuario
  // ============================================================
  test("SP-RES-04 Listar reseñas escritas por usuario", async () => {
    const mockRows = [
      { puntuacion: 5, comentarios: "Excelente servicio", nombreAutor: "Luis" }
    ];

    pool.query.mockResolvedValueOnce([mockRows]);

    const res = await request(app).get("/api/resenas/escritas/1?isProvider=0");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockRows);
  });

  // ============================================================
  // SP-RES-05 - Listar reseñas recibidas por proveedor
  // ============================================================
  test("SP-RES-05 Listar reseñas recibidas por proveedor", async () => {
    const mockRows = [
      { puntuacion: 4, comentarios: "Muy bien", nombreAutor: "Carlos" }
    ];

    pool.query.mockResolvedValueOnce([mockRows]);

    const res = await request(app).get("/api/resenas/recibidas/7?isProvider=1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockRows);
  });
});
