/**
 * APP SENDER CRM - ÓPTICA CRISTAL
 * Configurado para envíos masivos estables
 */

// URL de tu Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbz203TlLTaxgcOalBE_sIexuELTosu_l_0anrA18i7tXUkZlude-ApZOPNVFnysBNgt/exec";

const $ = (id) => document.getElementById(id);
const logEl = $("log");
let contacts = [];

function log(s) {
    const time = new Date().toLocaleTimeString();
    logEl.textContent += `[${time}] ${s}\n`;
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

// Lector de CSV optimizado
$("btnLoad").addEventListener("click", () => {
    const file = $("file").files[0];
    if (!file) return alert("Selecciona un archivo .csv");

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        
        contacts = [];
        // Saltamos la cabecera si existe
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(",");
            const phone = parts[0] ? parts[0].trim() : "";
            const name = parts[1] ? parts[1].trim() : "Cliente";
            if (phone) contacts.push({ phone, name });
        }
        
        $("cRead").textContent = contacts.length;
        $("cLeft").textContent = contacts.length;
        log(`Base cargada: ${contacts.length} contactos listos.`);
        $("status-text").textContent = "Base lista para enviar.";
    };
    reader.readAsText(file);
});

// Probar conexión (Ping)
$("btnPing").addEventListener("click", () => {
    window.open(`${API_URL}?action=ping`, "_blank");
});

// Proceso de Envío Masivo por Lotes
$("btnSend").addEventListener("click", async () => {
    if (!contacts.length) return alert("Carga un CSV primero.");
    const template = $("template").value.trim();
    const lang = $("lang").value.trim();
    const pause = parseInt($("pause").value) || 1500;

    if (!template) return alert("Escribe el nombre del template de Meta.");

    if (!confirm(`¿Iniciar envío a ${contacts.length} contactos?`)) return;

    $("status-text").textContent = "🚀 Enviando mensajes...";
    log("Iniciando envío masivo...");

    const batchSize = 50; // Enviamos de a 50 para no saturar Google
    let enviadosCount = 0;

    for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        
        try {
            const formData = new URLSearchParams();
            formData.append("action", "send_batch");
            formData.append("template", template);
            formData.append("lang", lang);
            formData.append("csv", JSON.stringify(batch));

            // Enviamos lote a Google
            await fetch(API_URL, {
                method: "POST",
                mode: "no-cors", // Para evitar problemas de seguridad
                body: formData
            });

            enviadosCount += batch.length;
            updateStats(enviadosCount);
            log(`Lote enviado: ${enviadosCount}/${contacts.length}`);

            // Pausa para que el navegador y Google respiren
            if (i + batchSize < contacts.length) {
                await new Promise(r => setTimeout(r, pause));
            }

        } catch (err) {
            log(`❌ Error en lote: ${err.message}`);
        }
    }

    log("✅ PROCESO FINALIZADO");
    $("status-text").textContent = "Envío masivo completado.";
});

// Limpiar
$("btnClear").addEventListener("click", () => {
    contacts = [];
    $("file").value = "";
    $("cRead").textContent = "0";
    $("cOk").textContent = "0";
    $("cLeft").textContent = "0";
    $("pbar").value = 0;
    $("progress-percent").textContent = "0%";
    logEl.textContent = "";
    $("status-text").textContent = "Limpiado.";
});
