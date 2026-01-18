// hootie edit
const express = require("express");
const cors = require("cors");
const http = require("http");
require("dotenv").config();
const path = require("path");
const cookieParser = require("cookie-parser");
const { initDb, getPool } = require("./config/db");
const initSockets = require("./sockets");
const routes = require("./routes");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 120 }); // TTL de 120 segundos (2 minutos)
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname));

app.use("/", routes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Servidor funcionando" });
});

async function start() {
  try {
    // ✅ Ensure DB exists and pool is ready before starting server
    await initDb();
    const pool = getPool();

    const server = http.createServer(app);
    const io = initSockets(server, pool);

    app.set("io", io);

    server.listen(PORT, () =>
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`),
    );
  } catch (err) {
    console.error("❌ Fatal startup error:", err);

    // For EB stability, don't hard-exit immediately; but you can exit if you prefer:
    // process.exit(1);
  }
}

start();
