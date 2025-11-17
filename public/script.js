document.getElementById("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        cedula: document.getElementById("cedula").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        ciudad: document.getElementById("ciudad").value.trim(),
        grooming: document.getElementById("grooming").value
    };

    const res = await fetch("/api/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const out = await res.json();

    if (res.status === 200) {
        document.getElementById("modalExito").classList.remove("hidden");
        e.target.reset();
    }
    else if (res.status === 409) {
        document.getElementById("modalDuplicado").classList.remove("hidden");
    }
    else {
        alert("Ocurrió un error inesperado.");
    }
});

function cerrarModales() {
    document.getElementById("modalExito").classList.add("hidden");
    document.getElementById("modalDuplicado").classList.add("hidden");
}