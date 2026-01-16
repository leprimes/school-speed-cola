const request = require("supertest");
const express = require("express");

// Mock BD
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));
const pool = require("../config/db");

const citasContratosRouter = require("../routes/contracts.routes.js");

const app = express();
app.use(express.json());
app.use(citasContratosRouter);

describe("Citas y Contratos", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // SP-CTR-01 - Crear cita válida
  // ============================================================
  test("SP-CTR-01 Crear cita válida", async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

    const res = await request(app)
      .post("/api/citas")
      .send({
        fecha: "2025-11-10",
        idCliente: 1,
        idProveedor: 2,
        idServicio: 3,
        costo: 200,
        especificaciones: "Limpieza general"
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(10);
    expect(res.body.estado).toBe("pendiente");
  });

  // ============================================================
  // SP-CTR-02 - Crear cita con datos faltantes
  // ============================================================
  test("SP-CTR-02 Crear cita con datos faltantes", async () => {
    const res = await request(app)
      .post("/api/citas")
      .send({ fecha: "", idCliente: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  // ============================================================
  // SP-CTR-03 - Consultar citas por usuario
  // ============================================================
  test("SP-CTR-03 Consultar citas por usuario", async () => {
    const fakeRows = [
      {
        idCita: 1,
        fecha: "2025-10-01",
        estado: "pendiente",
        nombreServicio: "Carpintería"
      }
    ];

    pool.query.mockResolvedValueOnce([fakeRows]);

    const res = await request(app).get("/api/citas/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeRows);
  });

  // ============================================================
  // SP-CTR-04 - Cambiar estado de cita a cancelado
  // ============================================================
  test("SP-CTR-04 Cambiar estado de cita a cancelado", async () => {
    // DELETE contrato
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    // UPDATE cita
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put("/api/citas/5/estado")
      .send({ estado: "cancelado" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Estado de cita cambiado a cancelado");
  });

  // ============================================================
  // SP-CTR-05 - Crear contrato válido
  // ============================================================
  test("SP-CTR-05 Crear contrato válido", async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 22 }]);

    const res = await request(app)
      .post("/api/contrato")
      .send({
        idCita: 1,
        fecha: "2025-11-11",
        idCliente: 1,
        idProveedor: 2,
        idServicio: 3,
        costo: 250,
        especificaciones: "Contrato formal"
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(22);
    expect(res.body.idCita).toBe(1);
  });

  // ============================================================
  // SP-CTR-06 - Obtener contratos por usuario
  // ============================================================
  test("SP-CTR-06 Obtener contratos por usuario", async () => {
    const fakeRows = [
      {
        idContrato: 7,
        idCita: 1,
        nombreServicio: "Electricista",
        estadoCita: "activo"
      }
    ];

    pool.query.mockResolvedValueOnce([fakeRows]);

    const res = await request(app).get("/api/contratos/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeRows);
  });
});
