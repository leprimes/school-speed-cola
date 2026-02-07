let servicios = [];
let categories = [];
let sessionInfo = { loggedIn: false, isProvider: false, user: null };

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Verificar sesión
    const response = await fetch("/api/check-session", {
      method: "GET",
      credentials: "include",
    });
    const sessionData = await response.json();
    console.log(sessionData);

    if (sessionData.loggedIn) {
      const role = String(sessionData.user?.isprovider || "").toLowerCase();
      const isProvider =
        role === "proveedor" || role === "1" || role === "true";

      sessionInfo = {
        loggedIn: true,
        isProvider,
        user: sessionData.user || null,
      };

      if (isProvider) {
        console.log("✅ Provider logged in — show Create Service button");

        const container = document.querySelector(".row.mb-4.g-3");
        if (container) {
          // prevent duplicate buttons if script runs twice
          if (!document.getElementById("createServiceBtn")) {
            const btn = document.createElement("button");
            btn.id = "createServiceBtn";
            btn.textContent = "Crear Servicio";
            btn.style.display = "block";
            btn.style.backgroundColor = "#f35525";
            btn.className = "btn btn-success mb-3";
            btn.setAttribute("data-bs-toggle", "modal");
            btn.setAttribute("data-bs-target", "#createServiceModal");

            container.insertBefore(btn, container.firstChild);
          }
        } else {
          console.warn(
            "Could not find container .row.mb-4.g-3 for Create button",
          );
        }
      } else {
        console.log("User is not provider — do not show Create Service button");
      }
    }

    try {
      // Cargar servicios
      const servicesUrl = sessionInfo.isProvider
        ? "/api/my-services"
        : "/api/servicesUsers";

      const resp = await fetch(servicesUrl, {
        method: "GET",
        credentials: "include",
      });
      servicios = await resp.json();

      // Cargar categorías para los filtros
      await loadServiceCategories();

      // Cargar categorías para el modal
      await loadCategoriesForModal();

      // Render inicial
      renderServices(servicios);

      // Eventos de filtro
      document
        .querySelector("#filterBtn")
        .addEventListener("click", applyFilters);
      document
        .querySelector("#resetFilters")
        .addEventListener("click", resetFilters);

      // Evento para crear servicio
      document
        .querySelector("#createServiceForm")
        .addEventListener("submit", handleCreateService);

      const priceRange = document.getElementById("priceRange");
      const priceValue = document.getElementById("priceValue");
      priceRange.addEventListener("input", () => {
        priceValue.textContent = priceRange.value;
      });

      const ratingRange = document.getElementById("ratingRange");
      const ratingValue = document.getElementById("ratingValue");
      ratingRange.addEventListener("input", () => {
        ratingValue.textContent = ratingRange.value;
      });
    } catch (error) {
      console.error("Error cargando servicios:", error);
    }
  } catch (error) {
    console.error("Error verificando sesión:", error);
  }
});

async function loadServiceCategories() {
  try {
    const resp = await fetch("/api/categories", {
      method: "GET",
      credentials: "include",
    });
    categories = await resp.json();

    const categorySelect = document.getElementById("categorySelect");
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.idCategoria;
      option.textContent = cat.descripcion;
      categorySelect.appendChild(option);
    });

    // Ya no aplicamos filtros al cambiar la categoría (solo con el botón)
  } catch (err) {
    console.error("Error cargando categorías:", err);
  }
}

// Función para cargar categorías en el modal
async function loadCategoriesForModal() {
  try {
    const response = await fetch("/api/categories", {
      method: "GET",
      credentials: "include",
    });
    const categories = await response.json();
    console.log("Categories loaded:", categories); // Debug

    const select = document.getElementById("serviceCategory");
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

// Aplicacion de filtros
function applyFilters() {
  let filtered = servicios.slice();

  // Verifica los elementos que ingresamos o escogemos en los filtros
  const searchText = document.getElementById("searchText").value.toLowerCase();
  const selectedCategory = document.getElementById("categorySelect").value;
  const maxPrice = parseFloat(document.getElementById("priceRange").value);
  const minRating = parseFloat(document.getElementById("ratingRange").value);

  // Filtro por texto (nombre, descripción o proveedor)
  if (searchText.trim() !== "") {
    filtered = filtered.filter((s) => {
      const providerName = (
        s.nombreProveedor ||
        sessionInfo.user?.name ||
        sessionInfo.user?.nombre ||
        ""
      ).toLowerCase();
      return (
        s.nombreServicio.toLowerCase().includes(searchText) ||
        s.descripcion.toLowerCase().includes(searchText) ||
        providerName.includes(searchText)
      );
    });
  }

  // Filtro por categoría
  if (selectedCategory !== "0") {
    filtered = filtered.filter(
      (s) => s.idCategoria.toString() === selectedCategory,
    );
  }

  // Filtro por precio máximo
  filtered = filtered.filter((s) => s.precio <= maxPrice);

  // Filtro por rating mínimo
  filtered = filtered.filter((s) => (s.ratingProveedor || 0) >= minRating);

  // Renderizar resultados filtrados
  renderServices(filtered);
}

// Reinicia los filtros a sus valores predeterminados
function resetFilters() {
  document.getElementById("categorySelect").value = "0";
  document.getElementById("searchText").value = "";
  document.getElementById("priceRange").value = 10000;
  document.getElementById("priceValue").textContent = 10000;
  document.getElementById("ratingRange").value = 0;
  document.getElementById("ratingValue").textContent = 0;

  renderServices(servicios);
}

function getCategoryName(idCategoria) {
  const cat = categories.find((c) => c.idCategoria === idCategoria);
  return cat ? cat.descripcion : "N/A";
}

// Renderizamos/Mostramos los servicios en la pag
function renderServices(list) {
  const container = document.getElementById("services-container");
  container.innerHTML = "";

  // EN DADO CASO que ninugno de los servicios coincida con los filtros, mostraremos este mensaje
  if (list.length === 0) {
    container.innerHTML = `<p class="text-center mt-4">No se encontraron servicios que coincidan con los filtros.</p>`;
    return;
  }

  // Cicla por la lista de servicios y los muestra
  list.forEach((servicio) => {
    const col = document.createElement("div");
    col.className =
      "col-lg-4 col-md-6 align-self-center mb-30 properties-items";

    const providerName =
      servicio.nombreProveedor ||
      sessionInfo.user?.name ||
      sessionInfo.user?.nombre ||
      "Proveedor";

    const categoryName =
      servicio.nombreCategoria || getCategoryName(servicio.idCategoria);

    // Simple HTML
    col.innerHTML = `
            <div class="item text-center">
                <a href="service-details.html?id=${servicio.idServicio}">
                    <img src="${servicio.imagen}" alt="${servicio.nombreServicio}">
                </a>
                <h4 class="service-title" style="font-size: 1.4rem; font-weight: bold; margin-top: 10px;">
                    ${servicio.nombreServicio}
                </h4>
                <ul style="text-align: left; margin-top: 10px;">
                    <li>Descripción: <span>${servicio.descripcion}</span></li>
                    <li>Proveedor: <span>${providerName}</span></li>
                    <li>Duración Estimada: <span>${servicio.duracionEstimada}</span></li>
                    <li>Categoria: <span>${categoryName}</span></li>
                    <li>Rating: <span>${servicio.ratingProveedor || "N/A"}</span></li>
                </ul>
                <h6 style="color: #28a745;">$${servicio.precio.toLocaleString()}</h6>
                <div class="main-button">
                    <a href="service-details.html?id=${servicio.idServicio}" class="btn btn-outline-primary">View Details</a>
                </div>
            </div>
        `;
    container.appendChild(col);
  });
}

// Función para manejar la creación del servicio
async function handleCreateService(e) {
  e.preventDefault();

  try {
    // Check session
    const sessionResponse = await fetch("/api/check-session", {
      method: "GET",
      credentials: "include",
    });

    const sessionData = await sessionResponse.json();
    console.log("Session data:", sessionData);

    if (!sessionData.loggedIn) {
      alert("Debes estar logeado como proveedor para poder crear un servicio");
      return;
    }

    // IMPORTANT: your API stores role in user.isprovider (bad name but ok)
    // Make this strict to avoid truthy issues
    const role = String(sessionData.user.isprovider || "").toLowerCase();
    const isProvider = role === "proveedor" || role === "1" || role === "true";

    if (!isProvider) {
      alert("Solo proveedores pueden crear servicios");
      return;
    }

    // Build service payload
    const formData = new FormData(e.target);

    const idCategoriaValue =
      formData.get("idCategoria") ||
      formData.get("serviceCategory") ||
      document.getElementById("serviceCategory")?.value ||
      "";

    const serviceData = {
      nombre: (formData.get("nombre") || "").trim(),
      descripcion: (formData.get("descripcion") || "").trim(),
      precio: parseFloat(formData.get("precio")),
      duracionEstimada: (formData.get("duracionEstimada") || "").trim(),
      imagen: (formData.get("imagen") || "").trim(),
      idCategoria: parseInt(idCategoriaValue, 10),
    };

    // Basic validation before hitting API
    if (
      !serviceData.nombre ||
      Number.isNaN(serviceData.precio) ||
      !serviceData.duracionEstimada ||
      Number.isNaN(serviceData.idCategoria)
    ) {
      alert(
        "Completa los campos requeridos: nombre, precio, duración e categoría.",
      );
      return;
    }

    console.log("Sending service data:", serviceData);

    const response = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(serviceData),
    });

    const data = await response.json();
    console.log("Response:", data);

    if (response.ok) {
      // Close modal
      const modalEl = document.getElementById("createServiceModal");
      const modal =
        bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.hide();

      // Reset form
      e.target.reset();

      // Refresh services list
      const resp = await fetch("/api/my-services", {
        method: "GET",
        credentials: "include",
      });
      servicios = await resp.json();
      renderServices(servicios);

      alert("Service created successfully!");
    } else {
      console.error("Server Error:", data);
      alert(
        "Error creando Servicio: " +
          (data.error || "Unknown error") +
          (data.details ? "\n" + data.details : ""),
      );
    }
  } catch (error) {
    console.error("Error Creando Servicio:", error);
    alert("Error Creando Servicio. Porfavor intente otra vez.");
  }
}
