const request = require('supertest');
const NodeCache = require('node-cache');

// Mock de la conexión a base de datos
jest.mock('../config/db', () => ({
  query: jest.fn(),
}));
const pool = require('../config/db');

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
};
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => mockCache);
});

// Importar router y crear app express de prueba
const express = require('express');
const categoriesRouter = require('../routes/categories.routes.js');

const app = express();
app.use(express.json());
app.use(categoriesRouter);

describe('Rutas /api/categories con NodeCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Cache miss → consulta DB y guarda en caché', async () => {
    // Simula respuesta de base de datos

    mockCache.get.mockReturnValueOnce(null);

    const fakeRows = [{ idCategoria: 1, nombre: 'Fontanería' }];
    pool.query.mockResolvedValueOnce([fakeRows]);

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeRows);
    expect(mockCache.get).toHaveBeenCalledWith('categories');
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(mockCache.set).toHaveBeenCalledWith('categories', fakeRows);
  });

  test('Cache hit → no consulta DB (usa caché)', async () => {
    const cachedRows = [{ idCategoria: 2, nombre: 'Electricista' }];
    mockCache.get.mockReturnValueOnce(cachedRows); // Simula caché activo

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(cachedRows);
    expect(pool.query).not.toHaveBeenCalled();
    expect(mockCache.get).toHaveBeenCalledWith('categories');
  });

  test('Error en base de datos -> devuelve 500', async () => {
    mockCache.get.mockReturnValueOnce(null); // Forzar cache miss
    pool.query.mockRejectedValueOnce(new Error('DB fail'));

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Error al mostrar Categorías');
  });
});
