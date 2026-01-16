module.exports = (io, socket, pool) => {
  // Este socket escucha los eventos que emiten las rutas
  socket.on("newServiceCreated", (service) => {
    io.emit("newService", {
      message: `Nuevo servicio creado: ${service.nombre}`,
      data: { nombre: service.nombre, precio: service.precio, idCategoria: service.idCategoria }
    });
  });
};
