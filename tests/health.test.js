jest.mock("../config/db", () => ({
  query: jest.fn()
}));

const request = require("supertest");
const app = require("../app-test");

describe("Health Check", () => {

  test("GET / debe responder OK", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
  });

  test("GET /health debe responder OK", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });

});
