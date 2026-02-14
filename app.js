/**
 * CRM WHATSAPP - ÓPTICA CRISTAL
 * Lógica de envío por lotes para bases grandes
 */

const API_URL = "https://script.google.com/macros/s/AKfycbwvdgqdOQf0zAUJ9UCJpCIYnBeE3L5mxjQ0Mx21YTwMWzj2ocCDxApR39mkhffPMHrf/exec";

const $ = (id) => document.getElementById(id);
const logEl = $("log");
let contacts = [];
let isStop = false;

function log(s, color = "#38bdf8") {
    const time = new Date().toLocaleTimeString();
    const line = document.createElement("div");
    line.style.color = color;
    line.textContent = `[${time}] ${s}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
}

function updateStats(enviados) {
    $("cOk").textContent = enviados;
    const pendientes = contacts.length - enviados;
    $("cLeft").textContent = pendientes >= 0 ? pendientes : 0;
    
    const porc = Math.round((enviados / contacts.length) * 100) || 0;
    $("pbar").value = porc;
    $("progress-percent").textContent = porc + "%";
}

// Cargar CSV
$("btnLoad").addEventListener("click", () => {
    const file = $("file").files[0];
    if (!file) return alert("Seleccioná el archivo CSV primero.");

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        
        contacts = [];
        // Empezamos en 1 para saltar el encabezado (phone, name)
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(",");
            if (parts[0]) {
                contacts.push({
                    phone: parts[0].trim(),
                    name: parts[1] ? parts[1].trim() : "Cliente"
                });
            }
        }
        
        $("cRead").textContent = contacts.length;
        $("cLeft").textContent = contacts.length;
        log(`Base cargada: ${contacts.length} contactos listos.`);
        $("status-text").textContent = "Base lista para difusión.";
    };
    reader.readAsText(file);
});

// Botón de Envío
$("btnSend").addEventListener("click", async () => {
    if (!contacts.length) return alert("Cargá un CSV primero.");
    const template = $("template").value.trim();
    const lang = $("lang").value.trim();
    const pause = parseInt($("pause").value) || 1200;

    if (!confirm(`¿Confirmás el envío a ${contacts.length} personas?`)) return;

    $("status-text").textContent = "🚀 Difusión en curso...";
    log("Iniciando proceso masivo...", "#10b981");

    let enviadosCount = 0;

    for (const person of contacts) {
        try {
            // Preparamos los datos para Google
            const formData = new URLSearchParams();
            formData.append("action", "send_one");
            formData.append("phone", person.phone);
            formData.append("name", person.name);
            formData.append("template", template);
            formData.append("lang", lang);

            // Enviamos (usamos no-cors porque Google no siempre responde amigablemente a navegadores)
            fetch(API_URL, {
                method: "POST",
                mode: "no-cors",
                body: formData
            });

            enviadosCount++;
            updateStats(enviadosCount);
            
            if (enviadosCount % 10 === 0) {
                log(`Progreso: ${enviadosCount} enviados...`);
            }

            // Pausa obligatoria entre mensajes para seguridad
            await new Promise(r => setTimeout(r, pause));

        } catch (err) {
            log(`❌ Error con ${person.phone}: ${err.message}`, "#ef4444");
        }
    }

    log("✅ DIFUSIÓN FINALIZADA CON ÉXITO", "#10b981");
    $("status-text").textContent = "Finalizado.";
});

// Ping
$("btnPing").addEventListener("click", () => {
    window.open(`${API_URL}?action=ping`, "_blank");
});

// Limpiar
$("btnClear").addEventListener("click", () => {
    location.reload();
});
