// ESTE ARCHIVO ES SOLO PARA PRUEBAS PARA NO DAÑAR SERVER.JS
// Es lo mismo con la diferencia de que este no aranca el servidor

const express = require("express");
const routes = require("./routes");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Crear app sin levantar servidor real
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Servidor activo" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/", routes);

module.exports = app;

