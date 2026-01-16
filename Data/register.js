document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // Evita recargar la página

  const name = document.getElementById('regName').value;
  const photo = document.getElementById('regPhoto').value;
  const isprovider = document.getElementById('isProvider').checked;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const phone = document.getElementById('regPhone').value;

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, photo, isprovider, email, password, phone})
    });

    if (response.ok) {
      const data = await response.json();
      alert('Usuario registrado con éxito: ' + data.name);
      e.target.reset();
      const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
      modal.hide();
    }
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', errData);
        alert('Error al registrar usuario');
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Falló la conexión con el servidor');
  }
});
