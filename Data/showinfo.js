let categories = [];
let servicios = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/check-session", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      alert("Usuario no logeado. Inicia sesión.");
      window.location.href = "../index.html";
      return;
    }

    const data = await response.json();
    const usuario = data.user;

    document.getElementById("idUsuario").value = usuario.id;
    document.getElementById("nombre").value = usuario.name;
    document.getElementById("email").value = usuario.email;
    document.getElementById("telefono").value = usuario.phone;
    document.getElementById("rol").value = usuario.isprovider
      ? "Proveedor"
      : "Cliente";

    const items = document.querySelectorAll(".list-group-item");
    items[0].innerHTML = `<strong>Name:</strong> ${usuario.name}`;
    items[1].innerHTML = `<strong>Email:</strong> ${usuario.email}`;
    items[2].innerHTML = `<strong>Phone:</strong> ${usuario.phone || "N/A"}`;
    items[3].innerHTML = `<strong>Role:</strong> ${usuario.isprovider ? "Proveedor" : "Cliente"}`;
    items[4].innerHTML = `<strong>User ID:</strong> ${usuario.id}`;

    cargarResenas(usuario.id, usuario.isprovider);

    if (usuario.isprovider) {
      const serviceResp = await fetch("/api/my-services", {
        method: "GET",
        credentials: "include",
      });

      if (serviceResp.ok) {
        const serviciosData = await serviceResp.json();
        servicios = Array.isArray(serviciosData) ? serviciosData : [];
        renderUserServices(servicios);
      } else {
        console.warn("No se pudo obtener servicios del proveedor");
      }
    }
  } catch (error) {
    console.error("Error cargando usuario logeado:", error);
    alert("Ocurrió un error. Intenta de nuevo.");
  }
});

function renderUserServices(list) {
  const container = document.getElementById("service-container");
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `<div class="text-center text-muted">No tienes servicios aún.</div>`;
    return;
  }

  container.innerHTML = list
    .map(
      (servicio) => `
    <div class="card shadow-sm p-4 rounded-3 mb-3">
      <h4 class="mb-3">Service Overview</h4>
      <ul class="list-group">
        <li class="list-group-item"><strong>Service Name:</strong> ${servicio.nombreServicio || "N/A"}</li>
        <li class="list-group-item"><strong>Description:</strong> ${servicio.descripcion || "N/A"}</li>
        <li class="list-group-item"><strong>Image Link:</strong> <a href="${servicio.imagen || "#"}" target="_blank">View Image</a></li>
        <li class="list-group-item"><strong>Estimated Duration:</strong> ${servicio.duracionEstimada || "N/A"}</li>
        <li class="list-group-item"><strong>Category:</strong> ${servicio.nombreCategoria || "N/A"}</li>
        <li class="list-group-item"><strong>Rating:</strong> ${servicio.ratingProveedor || "N/A"}</li>
        <li class="list-group-item"><strong>Price:</strong> $${servicio.precio?.toLocaleString() || "0"}</li>
        <li class="list-group-item"><strong>Service ID:</strong> ${servicio.idServicio}</li>
      </ul>
      <div class="mt-3 d-flex justify-content-end" id="service-buttons-${servicio.idServicio}"></div>
    </div>
  `,
    )
    .join("");

  list.forEach((servicio) => {
    const buttonsContainer = document.getElementById(
      `service-buttons-${servicio.idServicio}`,
    );

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-sm btn-warning me-2";
    editBtn.style.backgroundColor = "orangered";
    editBtn.setAttribute("data-bs-toggle", "modal");
    editBtn.setAttribute("data-bs-target", "#editServiceModal");
    editBtn.addEventListener("click", () => editService(servicio.idServicio));
    buttonsContainer.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn btn-sm btn-danger";

    deleteBtn.addEventListener("click", async () => {
      if (!confirm("¿Estás seguro que quieres eliminar este servicio?")) return;

      try {
        const response = await fetch(`/api/services/${servicio.idServicio}`, {
          method: "DELETE",
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          alert("Servicio eliminado correctamente");

          const resp = await fetch("/api/my-services", {
            method: "GET",
            credentials: "include",
          });
          const serviciosData = await resp.json();
          servicios = Array.isArray(serviciosData) ? serviciosData : [];
          renderUserServices(servicios);
        } else {
          alert(
            "Error eliminando servicio: " + (data.error || "Unknown error"),
          );
        }
      } catch (error) {
        console.error("Error eliminando servicio:", error);
        alert("Error eliminando servicio. Intenta nuevamente.");
      }
    });

    buttonsContainer.appendChild(deleteBtn);
  });
}

async function loadCategoriesForModal() {
  try {
    const response = await fetch("/api/categories", {
      method: "GET",
      credentials: "include",
    });
    const categories = await response.json();

    const select = document.getElementById("editServiceCategory");
    if (!select) return;
    select.innerHTML = '<option value="">Select a category</option>';

    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.idCategoria;
      option.textContent = cat.descripcion;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading categories for modal:", error);
  }
}

async function editService(idServicio) {
  try {
    const res = await fetch(`/api/services/${idServicio}`, {
      method: "GET",
      credentials: "include",
    });
    const servicio = await res.json();

    document.getElementById("editServiceId").value = servicio.idServicio;
    document.getElementById("editServiceName").value = servicio.nombreServicio;
    document.getElementById("editServiceDescription").value =
      servicio.descripcion;
    document.getElementById("editServicePrice").value = servicio.precio;
    document.getElementById("editServiceDuration").value =
      servicio.duracionEstimada;
    document.getElementById("editServiceImage").value = servicio.imagen;

    await loadCategoriesForModal();
    const categorySelect = document.getElementById("editServiceCategory");
    if (categorySelect) categorySelect.value = servicio.idCategoria;

    const modalEl = document.getElementById("editServiceModal");
    let modal = bootstrap.Modal.getInstance(modalEl);
    if (!modal) modal = new bootstrap.Modal(modalEl);

    modal.show();

    modalEl.addEventListener(
      "hidden.bs.modal",
      () => {
        document.getElementById("editServiceForm").reset();
        const openButton = document.getElementById(
          `editServiceButton-${idServicio}`,
        );
        if (openButton) openButton.focus();
      },
      { once: true },
    );
  } catch (err) {
    console.error("Error loading service:", err);
    alert("Error loading service data");
  }
}

async function cargarResenas(idUsuario, isProvider) {
  try {
    const [resEscritas, resRecibidas] = await Promise.all([
      fetch(`/api/resenas/escritas/${idUsuario}?isProvider=${isProvider}`),
      fetch(`/api/resenas/recibidas/${idUsuario}?isProvider=${isProvider}`),
    ]);

    const escritas = await resEscritas.json();
    const recibidas = await resRecibidas.json();

    renderResenas(
      "resenasEscritasContainer",
      escritas,
      "Aún no has escrito reseñas.",
    );
    renderResenas(
      "resenasRecibidasContainer",
      recibidas,
      "Aún no has recibido reseñas.",
    );
  } catch (err) {
    console.error("Error cargando reseñas:", err);
  }
}

function renderResenas(containerId, resenas, mensajeVacio) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!resenas || resenas.length === 0) {
    container.innerHTML = `<div class="text-center text-muted">${mensajeVacio}</div>`;
    return;
  }

  resenas.forEach((r) => {
    const stars = "⭐".repeat(Number(r.puntuacion || 0));
    const card = document.createElement("div");
    card.className = "rating-card";
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${r.nombreAutor || "Usuario Anónimo"}</strong><br>
          <span class="rating-stars">${stars}</span>
        </div>
        <small class="text-muted">${new Date(Date.now()).toLocaleDateString()}</small>
      </div>
      <p class="mt-2 mb-0">${r.comentarios || "(Sin comentarios)"}</p>
    `;
    container.appendChild(card);
  });
}

async function handleEditService(e) {
  e.preventDefault();
  const form = e.target;

  const updatedService = {
    nombre: form.nombre.value,
    descripcion: form.descripcion.value,
    precio: parseFloat(form.precio.value),
    duracionEstimada: form.duracionEstimada.value,
    imagen: form.imagen.value,
    idCategoria: parseInt(form.idCategoria.value),
  };

  const idServicio = document.getElementById("editServiceId").value;

  try {
    const response = await fetch(`/api/services/${idServicio}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updatedService),
    });

    const data = await response.json();

    if (response.ok) {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editServiceModal"),
      );
      modal.hide();

      alert("Service updated successfully!");
      location.reload();
    } else {
      alert("Error updating service: " + (data.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Error updating service:", error);
    alert("Unexpected error updating service.");
  }
}

document
  .getElementById("editServiceForm")
  .addEventListener("submit", handleEditService);

async function checkIfProvider() {
  try {
    const response = await fetch("/api/check-session", {
      credentials: "include",
    });
    const data = await response.json();

    if (
      data.loggedIn &&
      (data.user.isprovider === 1 || data.user.isprovider === true)
    ) {
      document.getElementById("providerChatButton").style.display = "block";
    }
  } catch (error) {
    console.error("Error verificando proveedor:", error);
  }
}

document
  .getElementById("userEditForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("idUsuario").value;

    const body = {
      nombre: document.getElementById("nombre").value,
      email: document.getElementById("email").value,
      telefono: document.getElementById("telefono").value,
    };

    const response = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Usuario actualizado correctamente");
      location.reload();
    } else {
      alert("Error actualizando usuario");
    }
  });

function goToChats() {
  window.location.href = "/chats.html";
}

window.addEventListener("DOMContentLoaded", checkIfProvider);
