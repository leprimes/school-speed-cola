const request = require("supertest");
const express = require("express");

// Mock DB
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));
const pool = require("../config/db");

// Importar router
const chatsRouter = require("../routes/chats.routes.js");

const app = express();
app.use(express.json());
app.use(chatsRouter);

describe("Rutas de Chats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // SP-CHT-01 - Obtener chats del proveedor
  // ============================================================
  test("SP-CHT-01 Obtener chats del proveedor", async () => {
    const mockChats = [
      {
        idChat: 1,
        idCliente: 5,
        idProveedor: 1,
        nombreCliente: "Carlos",
        fotoCliente: null,
        emailCliente: "carlos@mail.com",
        ultimoMensaje: "Hola, me interesa tu servicio",
        fechaUltimoMensaje: "2025-02-10T10:20:00",
      },
    ];

    pool.query.mockResolvedValueOnce([mockChats]);

    const res = await request(app).get("/api/chats/provider/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockChats);
  });

  // ============================================================
  // SP-CHT-02 - Obtener chats del cliente
  // ============================================================
  test("SP-CHT-02 Obtener chats del cliente", async () => {
    const mockChats = [
      {
        idChat: 3,
        idCliente: 2,
        idProveedor: 7,
        nombreProveedor: "Luis",
        fotoProveedor: "perfil.jpg",
        emailProveedor: "luis@mail.com",
        ultimoMensaje: "¿Cuando puedes venir?",
        fechaUltimoMensaje: "2025-02-11T15:30:00",
      },
    ];

    pool.query.mockResolvedValueOnce([mockChats]);

    const res = await request(app).get("/api/chats/client/2");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockChats);
  });

  // ============================================================
  // SP-CHT-03 - Proveedor sin chats activos
  // ============================================================
  test("SP-CHT-03 Proveedor sin chats activos", async () => {
    pool.query.mockResolvedValueOnce([[]]); // lista vacía

    const res = await request(app).get("/api/chats/provider/99");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // ============================================================
  // SP-CHT-04 - Cliente inexistente (DB Error)
  // ============================================================
  test("SP-CHT-04 Cliente inexistente - Error al obtener chats", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).get("/api/chats/client/9999");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al obtener chats");
  });
});
