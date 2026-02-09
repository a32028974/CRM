/* ==========================
   Envío WhatsApp 360dialog (CSV)
   - Compatible GitHub Pages (sin CORS)
   - Envío con FORM + IFRAME (no fetch)
========================== */

/** ✅ Pegá tu /exec acá */
const API_URL = "https://script.google.com/macros/s/AKfycbzTtvjlTXqIeGJRK2qdll4ubGogviRbFDIPylodLINuu_z-WB9GOPmSILWc0AzT4Qz2/exec";

const $ = (id)=>document.getElementById(id);
const logEl = $("log");

let contacts = [];

function log(s){
  logEl.textContent += s + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(txt){
  $("status").textContent = txt;
}

function parseCSV(text){
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if (lines.length <= 1) return [];

  const out = [];
  for (let i=1; i<lines.length; i++){
    // phone,name (simple)
    const parts = lines[i].split(",");
    const phone = (parts[0]||"").trim();
    const name  = (parts[1]||"").trim();
    if (phone) out.push({ phone, name });
  }
  return out;
}

/**
 * ✅ Envío sin CORS:
 * POST form-urlencoded hacia iframe oculto.
 * No podemos leer respuesta, pero el servidor recibe el request.
 */
function postFormNoCors(params){
  return new Promise((resolve)=>{
    const form = document.createElement("form");
    form.method = "POST";
    form.action = API_URL;
    form.target = "wa_sink";
    form.style.display = "none";
    form.enctype = "application/x-www-form-urlencoded";

    Object.entries(params).forEach(([k,v])=>{
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = String(v);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

    // esperamos un toque y resolvemos
    setTimeout(()=>{
      form.remove();
      resolve({ ok:true });
    }, 600);
  });
}

$("btnLoad").addEventListener("click", async ()=>{
  const f = $("file").files[0];
  if (!f) return alert("Elegí un CSV");

  const text = await f.text();
  contacts = parseCSV(text);

  $("cRead").textContent = contacts.length;
  $("cOk").textContent = contacts.length;

  setStatus("CSV cargado");
  log("CSV cargado.");
  log("Leídos: " + contacts.length);
});

$("btnPing").addEventListener("click", ()=>{
  if (!API_URL || API_URL.includes("PEGAR_")) {
    alert("Primero pegá tu API_URL en app.js");
    return;
  }
  // Ping por GET: lo abrimos en pestaña nueva para esquivar CORS
  const url = API_URL + "?action=ping";
  window.open(url, "_blank");
  log("Ping abierto en pestaña nueva: " + url);
});

$("btnClear").addEventListener("click", ()=>{
  contacts = [];
  $("file").value = "";
  $("cRead").textContent = "0";
  $("cOk").textContent = "0";
  setStatus("—");
  logEl.textContent = "";
});

$("btnSend").addEventListener("click", async ()=>{
  if (!API_URL || API_URL.includes("PEGAR_")) {
    alert("Primero pegá tu API_URL en app.js");
    return;
  }
  if (!contacts.length) return alert("Primero cargá un CSV");

  const template = $("template").value.trim();
  const lang = $("lang").value.trim();
  const lot = $("lot").value.trim();
  const pause = $("pause").value.trim();

  if (!template) return alert("Falta template");

  setStatus("Disparando envío…");
  log("Iniciando envío...");
  log(`Template: ${template} | Lang: ${lang} | Lote: ${lot} | Pausa: ${pause}ms`);
  log("⚠️ No se puede leer respuesta por CORS. Mirá la pestaña LOG del Apps Script.");

  await postFormNoCors({
    action: "send_batch",
    template,
    lang,
    lot,
    pause,
    csv: JSON.stringify(contacts)
  });

  setStatus("Lote disparado ✅");
  log("✅ Lote disparado. Confirmación real en Google Sheet → LOG.");
});
