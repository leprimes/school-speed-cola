
document.addEventListener("DOMContentLoaded", async () => {
        
    try {
        // Cargar servicios
        const resp = await fetch("/api/servicesIndex", { method: "GET", credentials: "include" });
        servicios = await resp.json();

        // Render inicial
        renderTop3Service(servicios);

    } catch (error) {
        console.error("Error cargando servicios:", error);
    }
        

});

function renderTop3Service(list) {
    const container = document.getElementById('services-top3-container');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<p class="text-center mt-4">No hay Servicios por el momento.</p>`;
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

