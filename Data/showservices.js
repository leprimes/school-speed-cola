let servicios = [];
let categories = [];

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Verificar sesión
        const response = await fetch("/api/check-session", {
            method: "GET",
            credentials: "include"
        });
        const sessionData = await response.json();
        console.log(sessionData)
        
        if (sessionData.loggedIn && sessionData.user.isprovider) {
            const emailProveedor = sessionData.user.email;

            // Verificar si YA tiene servicio creado
            const serviceCheck = await fetch(`/api/serviceProv/${emailProveedor}`, {
                method: "GET",
                credentials: "include"
            });

            if (serviceCheck.status === 404) {
                // NO TIENE SERVICIO → Mostrar botón
                console.log("Proveedor NO tiene servicio — mostrar botón");

                const container = document.querySelector(".row.mb-4.g-3");
                const btn = document.createElement("button");
                btn.textContent = "Crear Servicio";
                btn.style.display = "block";
                btn.style.backgroundColor = '#f35525';
                btn.className = "btn btn-success mb-3";
                btn.setAttribute("data-bs-toggle", "modal");
                btn.setAttribute("data-bs-target", "#createServiceModal");

                container.insertBefore(btn, container.firstChild);
            } else {
                // Tiene servicio → No mostrar botón
                console.log("Proveedor YA TIENE servicio — ocultar botón");
            }
        }

        try {
            // Cargar servicios
            const resp = await fetch("/api/servicesUsers", { method: "GET", credentials: "include" });
            servicios = await resp.json();

            // Cargar categorías para los filtros
            await loadServiceCategories();
            
            // Cargar categorías para el modal
            await loadCategoriesForModal();

            // Render inicial
            renderServices(servicios);

            // Eventos de filtro
            document.querySelector('#filterBtn').addEventListener('click', applyFilters);
            document.querySelector('#resetFilters').addEventListener('click', resetFilters);

            // Evento para crear servicio
            document.querySelector('#createServiceForm').addEventListener('submit', handleCreateService);

            const priceRange = document.getElementById('priceRange');
            const priceValue = document.getElementById('priceValue');
            priceRange.addEventListener('input', () => { 
                priceValue.textContent = priceRange.value; 
            });

            const ratingRange = document.getElementById('ratingRange');
            const ratingValue = document.getElementById('ratingValue');
            ratingRange.addEventListener('input', () => { 
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
        const resp = await fetch("/api/categories", { method: "GET", credentials: "include" });
        categories = await resp.json();

        const categorySelect = document.getElementById('categorySelect');
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.idCategoria;
            option.textContent = cat.descripcion;
            categorySelect.appendChild(option);
        });

        // Ya no aplicamos filtros al cambiar la categoría (solo con el botón)
    } catch (err) {
        console.error('Error cargando categorías:', err);
    }
}

// Función para cargar categorías en el modal
async function loadCategoriesForModal() {
    try {
        const response = await fetch("/api/categories", { method: "GET", credentials: "include" });
        const categories = await response.json();
        console.log("Categories loaded:", categories); // Debug
        
        const select = document.getElementById('serviceCategory');
        categories.forEach(cat => {
            const option = document.createElement('option');
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
    const searchText = document.getElementById('searchText').value.toLowerCase();
    const selectedCategory = document.getElementById('categorySelect').value;
    const maxPrice = parseFloat(document.getElementById('priceRange').value);
    const minRating = parseFloat(document.getElementById('ratingRange').value);

    // Filtro por texto (nombre, descripción o proveedor)
    if (searchText.trim() !== "") {
        filtered = filtered.filter(s =>
            s.nombreServicio.toLowerCase().includes(searchText) ||
            s.descripcion.toLowerCase().includes(searchText) ||
            (s.nombreProveedor && s.nombreProveedor.toLowerCase().includes(searchText))
        );
    }

    // Filtro por categoría
    if (selectedCategory !== "0") {
        filtered = filtered.filter(s => s.idCategoria.toString() === selectedCategory);
    }

    // Filtro por precio máximo
    filtered = filtered.filter(s => s.precio <= maxPrice);

    // Filtro por rating mínimo
    filtered = filtered.filter(s => (s.ratingProveedor || 0) >= minRating);

    // Renderizar resultados filtrados
    renderServices(filtered);
}

// Reinicia los filtros a sus valores predeterminados
function resetFilters() {
    document.getElementById('categorySelect').value = "0";
    document.getElementById('searchText').value = "";
    document.getElementById('priceRange').value = 10000;
    document.getElementById('priceValue').textContent = 10000;
    document.getElementById('ratingRange').value = 0;
    document.getElementById('ratingValue').textContent = 0;

    renderServices(servicios);
}

// Renderizamos/Mostramos los servicios en la pag
function renderServices(list) {
    const container = document.getElementById('services-container');
    container.innerHTML = '';

    // EN DADO CASO que ninugno de los servicios coincida con los filtros, mostraremos este mensaje
    if (list.length === 0) {
        container.innerHTML = `<p class="text-center mt-4">No se encontraron servicios que coincidan con los filtros.</p>`;
        return;
    }

    // Cicla por la lista de servicios y los muestra
    list.forEach(servicio => {
        const col = document.createElement("div");
        col.className = "col-lg-4 col-md-6 align-self-center mb-30 properties-items";

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
                    <li>Proveedor: <span>${servicio.nombreProveedor}</span></li>
                    <li>Duración Estimada: <span>${servicio.duracionEstimada}</span></li>
                    <li>Categoria: <span>${servicio.nombreCategoria || 'N/A'}</span></li>
                    <li>Rating: <span>${servicio.ratingProveedor || 'N/A'}</span></li>
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
        // Obtiene informacion del usuario
        const sessionResponse = await fetch("/api/check-session", {
            method: "GET",
            credentials: "include"
        });
        const sessionData = await sessionResponse.json();
        console.log("Session data:", sessionData);
        
        // Verifica si estamos logeados para poder creear un servicio
        if (!sessionData.loggedIn) {
            alert("Debes estar logeado como proveedor para poder crear un servicio");
            return;
        }
        
        // Mismo que el anterior, solo verifica si somos proveedores
        if (!sessionData.user.isprovider) {
            alert("Solo proveedores pueden crear servicios");
            return;
        }

        const serviceResp = await fetch(`/api/serviceProv/${sessionData.user.email}`, {
            method: "GET",
            credentials: "include"
        });

        // Verificar si el fetch fue exitoso
        if (serviceResp.ok) {
            const servicioExistente = await serviceResp.json();
            if (servicioExistente) {
                alert("Ya tienes un servicio creado. No puedes crear otro.");
                return;
            }
        } else if (serviceResp.status !== 404) {
            // Si no es 404, mostrar error
            console.error("Error verificando servicio:", serviceResp.status, serviceResp.statusText);
            alert("Ocurrió un error al verificar tu servicio. Intenta de nuevo.");
            return;
        }
        // Si es 404, significa que no tiene servicio, seguimos con la creación

        
        // Genera los datos para mandar a la DB (Obtenemos email del usuario para luego rescatar el id)
        const formData = new FormData(e.target);
        const serviceData = {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            precio: parseFloat(formData.get('precio')),
            duracionEstimada: formData.get('duracionEstimada'),
            imagen: formData.get('imagen'),
            idCategoria: parseInt(formData.get('idCategoria')),
            email: sessionData.user.email
        };

        console.log("Sending service data:", serviceData);

        // Metodo POST que se encuentra en server.js
        const response = await fetch("/api/services", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(serviceData)
        });

        // Obtenemos datos, console log solo es para debug
        const data = await response.json();
        console.log("Response:", data);

        // Si la respuesta de la insercion esta bien entonces cierra el modal y lo prepara
        if (response.ok) {
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('createServiceModal'));
            modal.hide();
            
            // Limpiar formulario
            e.target.reset();
            
            // Recargar servicios
            const resp = await fetch("/api/servicesUsers", { method: "GET", credentials: "include" });
            servicios = await resp.json();
            renderServices(servicios);
            
            alert("Service created successfully!");
        } else {
            console.error("Server Error:", data);
            alert("Error creando Servicio: " + (data.error || "Unknown error") + (data.details ? "\n" + data.details : ""));
        }
    } catch (error) {
        console.error("Error Creando Servicio:", error);
        alert("Error Creando Servicio. Porfavor intente otra vez.");
    }
}




