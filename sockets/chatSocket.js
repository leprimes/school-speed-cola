module.exports = (
  io,
  socket,
  pool,
  connectedUsers,
  isAuthenticated,
  getUserId,
) => {
  // ENVIAR MENSAJE PRIVADO
  socket.on("send_private_message", async (data) => {
    if (!isAuthenticated()) {
      socket.emit("error", { message: "No autenticado" });
      return;
    }

    const toUserId = parseInt(data.toUserId);
    const fromUserId = parseInt(getUserId());
    const { message, isProvider } = data;

    if (isNaN(toUserId) || isNaN(fromUserId)) {
      socket.emit("error", { message: "IDs de usuario inválidos" });
      return;
    }

    try {
      const idCliente = isProvider ? toUserId : fromUserId;
      const idProveedor = isProvider ? fromUserId : toUserId;

      let chatId;
      const [existingChats] = await pool.query(
        "SELECT idChat FROM chats WHERE idCliente = ? AND idProveedor = ?",
        [idCliente, idProveedor],
      );

      if (existingChats.length > 0) {
        chatId = existingChats[0].idChat;
      } else {
        const [newChat] = await pool.query(
          "INSERT INTO chats (idCliente, idProveedor) VALUES (?, ?)",
          [idCliente, idProveedor],
        );
        chatId = newChat.insertId;
      }

      const [insertResult] = await pool.query(
        "INSERT INTO mensajes (idChat, idUsuario, contenido) VALUES (?, ?, ?)",
        [chatId, fromUserId, message],
      );

      const recipientSocketId = connectedUsers.get(String(toUserId));

      const messageData = {
        from: fromUserId,
        message,
        timestamp: new Date(),
        chatId,
      };

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("new_message", messageData);
        socket.emit("message_delivered", {
          ...messageData,
          to: toUserId,
          status: "delivered",
        });
      } else {
        socket.emit("message_delivered", {
          ...messageData,
          to: toUserId,
          status: "offline",
        });
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      socket.emit("error", {
        message: "Error al enviar mensaje",
        details: error.message,
      });
    }
  });

  //  OBTENER HISTORIAL DE CHAT
  socket.on("get_chat_history", async (data) => {
    const userId1 = parseInt(data.userId1);
    const userId2 = parseInt(data.userId2);
    const { isProvider } = data;

    try {
      const idCliente = isProvider ? userId2 : userId1;
      const idProveedor = isProvider ? userId1 : userId2;

      const [chats] = await pool.query(
        "SELECT idChat FROM chats WHERE idCliente = ? AND idProveedor = ?",
        [idCliente, idProveedor],
      );

      if (chats.length === 0) {
        socket.emit("chat_history", []);
        return;
      }

      const chatId = chats[0].idChat;

      const [messages] = await pool.query(
        `SELECT 
          m.idMensaje,
          m.idUsuario,
          m.contenido AS mensaje,
          m.timestampEnvio AS fechaEnvio,
          u.nombre AS nombreUsuario
        FROM mensajes m
        JOIN usuarios u ON m.idUsuario = u.idUsuario
        WHERE m.idChat = ?
        ORDER BY m.timestampEnvio ASC
        LIMIT 100`,
        [chatId],
      );

      socket.emit("chat_history", messages);
    } catch (error) {
      console.error("Error obteniendo historial:", error);
      socket.emit("chat_history", []);
    }
  });
};
