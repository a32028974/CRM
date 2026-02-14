const API_URL = "https://script.google.com/macros/s/AKfycbz5h3GQpCmPVqRpgAdr53AhzmyZ6wB20xGpUClJeVGDQYWsGeCOkihg10l2uHqmexk/exec";

const $ = (id) => document.getElementById(id);
const logEl = $("log");
let contacts = [];

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
    if (!file) return alert("Seleccioná el archivo CSV.");

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        contacts = [];
        
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(",");
            if (parts[0]) {
                // Limpiamos el número de cualquier caracter que no sea número
                let cleanPhone = parts[0].replace(/\D/g, "");
                contacts.push({
                    phone: cleanPhone,
                    name: parts[1] ? parts[1].trim() : "Cliente"
                });
            }
        }
        $("cRead").textContent = contacts.length;
        $("cLeft").textContent = contacts.length;
        log(`✅ Base cargada: ${contacts.length} contactos.`);
    };
    reader.readAsText(file);
});

// Iniciar Envío
$("btnSend").addEventListener("click", async () => {
    if (!contacts.length) return alert("Cargá un CSV.");
    const template = $("template").value.trim();
    const lang = $("lang").value.trim();
    const pause = parseInt($("pause").value) || 1200;

    if (!confirm(`¿Enviar a ${contacts.length} personas?`)) return;

    log("🚀 Iniciando difusión masiva...", "#10b981");

    let enviadosCount = 0;
    for (const person of contacts) {
        try {
            const params = new URLSearchParams();
            params.append("phone", person.phone);
            params.append("name", person.name);
            params.append("template", template);
            params.append("lang", lang);

            // Usamos POST para enviar
            await fetch(API_URL, {
                method: "POST",
                mode: "no-cors",
                body: params
            });

            enviadosCount++;
            updateStats(enviadosCount);
            
            if (enviadosCount % 5 === 0) log(`Progreso: ${enviadosCount} enviados...`);
            
            await new Promise(r => setTimeout(r, pause));
        } catch (err) {
            log(`❌ Error con ${person.phone}: ${err.message}`, "#ef4444");
        }
    }
    log("🏁 PROCESO COMPLETADO", "#10b981");
});

// Botón de Diagnóstico
$("btnPing").addEventListener("click", () => {
    window.open(`${API_URL}?action=leer_error`, "_blank");
});
