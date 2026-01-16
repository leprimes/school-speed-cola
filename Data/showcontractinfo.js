async function loadUserData() {
    const response = await fetch("/api/check-session", {
        method: "GET",
        credentials: "include"
    });

    if (!response.ok) {
        alert("Usuario no logeado. Inicia sesión.");
        window.location.href = "../index.html";
        return;
    }

    const data = await response.json();
    const usuario = data.user;
    const idUsuario = usuario.id;
    const rol = usuario.isprovider;

    console.log("Usuario logeado:", usuario);

    // detecta si el usuario es proveedor
    const isProvider = rol === 1;
    await loadCitas(idUsuario, isProvider);
    await loadContratos(idUsuario);
}

async function loadCitas(idUsuario, isProvider) {
    const res = await fetch(`/api/citas/${idUsuario}`);
    const citas = await res.json();
    const tbody = document.getElementById("citas-body");
    tbody.innerHTML = "";

    console.log("Citas obtenidas:", citas);

    citas.forEach(c => {
        const tr = document.createElement("tr");

        const citaId = c.idCita || c.id || c.id_cita;
        const idProv = Number(c.idProveedor || c.id_proveedor || c.proveedorId);
        const idCli = Number(c.idCliente || c.id_cliente || c.clienteId);
        const estado = (c.estado || "").toString().trim().toLowerCase();
        const fecha = c.fecha ? new Date(c.fecha) : null;
        const fechaTexto = fecha ? fecha.toLocaleString() : "-";

        let accionHTML = "";

        // Aceptar (proveedor)
        if (idUsuario === idProv && estado === "pendiente") {
            accionHTML += `<button class="btn btn-sm btn-success me-1" onclick="cambiarEstado(${citaId}, 'activo', ${idUsuario})">Aceptar</button>`;
        }

        // Marcar Terminado (cliente)
        if (idUsuario === idCli && estado === "activo") {
            accionHTML += `<button class="btn btn-sm btn-info me-1" onclick="cambiarEstado(${citaId}, 'terminado', ${idUsuario})">Terminar</button>`;
        }

        // Cancelar (ambos)
        if (estado !== "cancelado" && estado !== "terminado") {
            accionHTML += `<button class="btn btn-sm btn-danger" onclick="cancelarCita(${citaId}, ${idUsuario})">Cancelar</button>`;
        }

        // Evaluación (reseña) si la cita está terminada
        if (estado === "terminado") {
            // Si el usuario es cliente → reseña proveedor
            if (idUsuario === idCli) {
                accionHTML += `<span id="btnResenaProv-${idProv}-${idCli}"></span>`;
                verificarResenaExistente("proveedor", idCli, idProv);
            }

            // Si el usuario es proveedor → reseña usuario
            if (idUsuario === idProv) {
                accionHTML += `<span id="btnResenaUser-${idProv}-${idCli}"></span>`;
                verificarResenaExistente("usuario", idProv, idCli);
            }
        }

        // Color del estado
        const estadoDisplay = c.estado || "-";
        const badgeClass =
            estadoDisplay.toLowerCase().includes("pend") ? "warning" :
            estadoDisplay.toLowerCase().includes("activo") ? "primary" :
            estadoDisplay.toLowerCase().includes("cancel") ? "danger" :
            "success";

        tr.innerHTML = `
            <td>${citaId}</td>
            <td>${c.nombreServicio || "-"}</td>
            <td>${c.nombreProveedor || "-"}</td>
            <td>${c.nombreCliente || "-"}</td>
            <td>${fechaTexto}</td>
            <td><span class="badge bg-${badgeClass}">${estadoDisplay}</span></td>
            <td>${accionHTML || "<span class='text-muted'>-</span>"}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function cambiarEstado(idCita, nuevoEstado) {
    console.log("Actualizando estado cita", idCita, "->", nuevoEstado);
    const res = await fetch(`/api/citas/${idCita}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
    });

    if (res.ok) {
        alert("Estado actualizado correctamente");
        loadUserData();
    } else {
        const err = await res.json();
        alert("Error al actualizar estado: " + (err.details || ""));
    }
}

async function loadContratos(idUsuario) {
  const res = await fetch(`/api/contratos/${idUsuario}`);
  const contratos = await res.json();
  const tbody = document.getElementById("contratos-body");
  tbody.innerHTML = "";

  console.log("Contratos obtenidos:", contratos);

  contratos.forEach(ct => {
    const tr = document.createElement("tr");
    const estado = (ct.estadoCita || "").trim().toLowerCase();
    const fecha = new Date(ct.fechaCita || ct.fecha).toLocaleString();

    // Mostrar "Activo" en verde, o "-" si no lo es
    const estadoHTML =
      estado === "activo"
        ? `<span style="color: green; font-weight: 600;">Activo</span>`
        : `<span style="color: #888;">-</span>`;

    tr.innerHTML = `
      <td>${ct.nombreServicio || "-"}</td>
      <td>${ct.nombreProveedor || "-"}</td>
      <td>${ct.nombreCliente || "-"}</td>
      <td>${fecha}</td>
      <td>$${ct.costo}</td>
      <td>${ct.especificaciones || "-"}</td>
      <td>${estadoHTML}</td>
    `;

    tbody.appendChild(tr);
  });
}





async function cancelarCita(idCita, idUsuario) {
  if (!confirm("¿Seguro que deseas cancelar esta cita? Se eliminará su contrato asociado.")) return;

  try {
    const res = await fetch(`/api/citas/${idCita}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ estado: "cancelado" })
    });

    if (res.ok) {
      alert("Cita cancelada correctamente.");
      await loadCitas(idUsuario);
      await loadContratos(idUsuario);
    } else {
      const error = await res.json().catch(() => ({}));
      alert("Error al cancelar cita: " + (error.details || error.error || res.statusText));
    }
  } catch (err) {
    console.error("Error cancelando cita:", err);
    alert("Error de red al intentar cancelar la cita.");
  }
}

function abrirModalResena(tipo, idUsuario, idProveedor) {
  console.log("Abriendo modal reseña:", { tipo, idUsuario, idProveedor });

  document.getElementById("tipoResena").value = tipo;
  document.getElementById("idUsuarioResena").value = idUsuario;
  document.getElementById("idProveedorResena").value = idProveedor;

  // Verificar si ya existe reseña antes de abrir
  const url = `/api/resena/${tipo}/${idUsuario}/${idProveedor}`;
  fetch(url)
    .then(r => r.json())
    .then(d => {
      if (d.exists) {
        alert("Ya se ha dejado una reseña para este servicio.");
      } else {
        const modal = new bootstrap.Modal(document.getElementById("modalResena"));
        modal.show();
      }
    });
}

async function verificarResenaExistente(tipo, idA, idB) {
  try {
    const res = await fetch(`/api/resena/${tipo}/${idA}/${idB}`);
    const data = await res.json();
    const existe = data.exists;

    // Construir el botón adecuado
    const spanId =
      tipo === "proveedor"
        ? `btnResenaProv-${idB}-${idA}`
        : `btnResenaUser-${idA}-${idB}`;

    const span = document.getElementById(spanId);
    if (!span) return;

    if (existe) {
      span.innerHTML = `<button class="btn btn-sm btn-secondary me-1" onclick="abrirModalResena('${tipo}', ${idA}, ${idB})">Editar Reseña</button>`;
    } else {
      const texto = tipo === "proveedor" ? "Reseñar Proveedor" : "Evaluar Usuario";
      span.innerHTML = `<button class="btn btn-sm btn-warning me-1" onclick="abrirModalResena('${tipo}', ${idA}, ${idB})">${texto}</button>`;
    }
  } catch (err) {
    console.error("Error verificando reseña existente:", err);
  }
}


document.getElementById("formResena").addEventListener("submit", async e => {
  e.preventDefault();

  const tipo = document.getElementById("tipoResena").value;
  const idUsuario = document.getElementById("idUsuarioResena").value;
  const idProveedor = document.getElementById("idProveedorResena").value;
  const puntuacion = document.getElementById("puntuacionResena").value;
  const comentarios = document.getElementById("comentariosResena").value;

  if (!puntuacion || !comentarios) {
    alert("Completa todos los campos.");
    return;
  }

  const endpoint = tipo === "proveedor" ? "/api/resenaProveedor" : "/api/resenaUsuario";
  const body = tipo === "proveedor"
    ? { idUsuario, idProveedor, puntuacion, comentarios }
    : { idProveedor, idUsuario, puntuacion, comentarios };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    alert("Reseña enviada correctamente.");
    bootstrap.Modal.getInstance(document.getElementById("modalResena")).hide();
    e.target.reset();
  } else {
    alert("Error al enviar la reseña.");
  }
});



document.addEventListener("DOMContentLoaded", loadUserData);