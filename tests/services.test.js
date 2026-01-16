const request = require("supertest");
const NodeCache = require("node-cache");

// Mock DB
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));
const pool = require("../config/db");

// Mock Cache
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock("node-cache", () => {
  return jest.fn().mockImplementation(() => mockCache);
});

// Crear app Express
const express = require("express");
const servicesRouter = require("../routes/services.routes.js");

const app = express();
app.use(express.json());
app.set("io", { emit: jest.fn() }); // mock socket
app.use(servicesRouter);


describe("Rutas de Servicios", () => {
  beforeEach(() => {
  jest.clearAllMocks();
  pool.query.mockReset();
  mockCache.get.mockReset();
  mockCache.set.mockReset();
});

  // ============================================================
  // SP-SRV-01 CAMBIAR A COMENTARIOS MAS CHIDOS
  // ============================================================
   test("GET /api/services - Cache hit → no DB", async () => {
    const cached = [{ idServicio: 1, nombre: "Carpintería" }];
    mockCache.get.mockReturnValueOnce(cached);

    const res = await request(app).get("/api/services");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(cached);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("GET /api/services - Cache miss → consulta DB", async () => {
    mockCache.get.mockReturnValueOnce(null);

    const fakeRows = [{ idServicio: 2, nombre: "Plomería" }];
    pool.query.mockResolvedValueOnce([fakeRows]);

    const res = await request(app).get("/api/services");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeRows);
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(mockCache.set).toHaveBeenCalledWith("services", fakeRows);
  });

  test("GET /api/services - Error DB", async () => {
    mockCache.get.mockReturnValueOnce(null);
    pool.query.mockRejectedValueOnce(new Error("DB fail"));

    const res = await request(app).get("/api/services");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al mostrar servicios");
  });

  // ============================================================
  // POST /api/services
  // ============================================================
  test("POST /api/services - Missing fields", async () => {
    const res = await request(app).post("/api/services").send({
      descripcion: "x",
      precio: 50,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  test("POST /api/services - Creado OK", async () => {
    pool.query
      .mockResolvedValueOnce([[{ idUsuario: 10 }]]) // buscar usuario
      .mockResolvedValueOnce([{ insertId: 123 }]); // insertar servicio

    const res = await request(app).post("/api/services").send({
      nombre: "Nuevo",
      descripcion: "desc",
      precio: 100,
      duracionEstimada: "1h",
      imagen: "img.png",
      idCategoria: 2,
      email: "user@mail.com",
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(123);
  });

  // ============================================================
  // GET /api/servicesUsers
  // ============================================================
  test("GET /api/servicesUsers - OK", async () => {
    const rows = [{ idServicio: 1, nombreServicio: "Fontanería" }];
    pool.query.mockResolvedValueOnce([rows]);

    const res = await request(app).get("/api/servicesUsers");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
  });

  // ============================================================
  // GET /api/servicesIndex (TOP 3)
  // ============================================================
  test("GET /api/servicesIndex - OK", async () => {
    const rows = [{ idServicio: 3, nombreServicio: "Electricista" }];
    pool.query.mockResolvedValueOnce([rows]);

    const res = await request(app).get("/api/servicesIndex");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
  });

  // ============================================================
  // GET /api/services/:id
  // ============================================================
  test("GET /api/services/:id - Encontrado", async () => {
    const row = {
      idServicio: 5,
      nombreServicio: "Carpintería fina",
    };
    pool.query.mockResolvedValueOnce([[row]]);

    const res = await request(app).get("/api/services/5");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(row);
  });


  // ============================================================
  // GET /api/serviceProv/:email
  // ============================================================
  test("GET /api/serviceProv/:email - Encontrado", async () => {
    const row = { idServicio: 1, nombreServicio: "Jardinería" };
    pool.query.mockResolvedValueOnce([[row]]);

    const res = await request(app).get("/api/serviceProv/test@mail.com");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(row);
  });

  // ============================================================
  // PUT /api/services/:id
  // ============================================================
  test("PUT /api/services/:id - Actualizado OK", async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app).put("/api/services/5").send({
      nombre: "A",
      descripcion: "desc",
      precio: 10,
      duracionEstimada: "1h",
      imagen: "img",
      idCategoria: 1,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Service updated successfully");
  });

  // ============================================================
  // DELETE /api/services/:id
  // ============================================================
  test("DELETE /api/services/:id - OK", async () => {
    pool.query.mockResolvedValueOnce();

    const res = await request(app).delete("/api/services/10");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Servicio eliminado");
  });
});
