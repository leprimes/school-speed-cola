document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("regName").value;
    const foto = document.getElementById("regPhoto").value;
    const isProviderChecked = document.getElementById("isProvider").checked;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const phone = document.getElementById("regPhone").value;

    // IMPORTANT: convert checkbox → role string
    const isprovider = isProviderChecked ? "proveedor" : "cliente";

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          foto,
          isprovider,
          email,
          password,
          phone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Usuario registrado con éxito: " + data.name);

        e.target.reset();
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("registerModal"),
        );
        modal.hide();
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error("Error del servidor:", errData);
        alert("Error al registrar usuario");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Falló la conexión con el servidor");
    }
  });
