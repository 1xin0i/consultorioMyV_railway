/**
 * Suite E2E Automatizada - Consultorio M&V
 * QA Automation Senior
 */

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE_URL = "http://localhost:5173";
const API_URL = "http://localhost:3000/api";

const results = [];
const consoleErrors = [];
const networkFailures = [];

function recordResult(code, title, passed, details = {}) {
  results.push({
    code,
    title,
    status: passed ? "PASS" : "FAIL",
    step: details.step || "",
    expected: details.expected || "",
    obtained: details.obtained || "",
    consoleErrors: [...consoleErrors],
    networkFailures: [...networkFailures],
    notes: details.notes || "",
  });
  consoleErrors.length = 0;
  networkFailures.length = 0;

  const tag = passed ? "[PASS]" : "[FAIL]";
  console.log(`${tag} ${code}: ${title}`);
  if (!passed) {
    console.log(`   -> Paso: ${details.step}`);
    console.log(`   -> Esperado: ${details.expected}`);
    console.log(`   -> Obtenido: ${details.obtained}`);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSuite() {
  console.log("=== INICIANDO SUITE DE PRUEBAS END-TO-END QA SENIOR ===");
  console.log(`Objetivo: ${BASE_URL}`);

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: "new",
      defaultViewport: { width: 1366, height: 768 },
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    page = await browser.newPage();

    // Capturar errores de consola
    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === "error") {
        consoleErrors.push(`[CONSOLE ERROR] ${text}`);
      } else if (type === "warning" && text.includes("Unhandled")) {
        consoleErrors.push(`[CONSOLE WARN] ${text}`);
      }
    });

    page.on("pageerror", (err) => {
      consoleErrors.push(`[UNCAUGHT EXCEPTION] ${err.message}`);
    });

    // Capturar fallas de red
    page.on("response", async (res) => {
      const status = res.status();
      const url = res.url();
      if (status >= 400 && !url.includes("/auth/login") && !url.includes("favicon")) {
        try {
          const body = await res.text();
          networkFailures.push(`[HTTP ${status}] ${res.request().method()} ${url} -> ${body.slice(0, 200)}`);
        } catch {
          networkFailures.push(`[HTTP ${status}] ${res.request().method()} ${url}`);
        }
      }
    });

    page.on("requestfailed", (req) => {
      networkFailures.push(`[REQUEST FAILED] ${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
    });

    // =========================================================================
    // PRE-REQUISITO: AUTENTICACIÓN
    // =========================================================================
    console.log("\n--- AUTENTICACIÓN Y ACCESO AL SISTEMA ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await sleep(500);

    // Intentar login con credenciales erróneas
    await page.type('input[autoComplete="username"], input[type="text"]', "admin_invalido");
    await page.type('input[type="password"]', "password_incorrecta");
    await page.click('button[type="submit"]');
    await sleep(800);

    const errorMsgElement = await page.$(".bg-rose-50, .text-rose-600, .text-rose-700");
    const errorText = errorMsgElement ? await page.evaluate(el => el.textContent, errorMsgElement) : "";
    const loginRechazado = errorText.toLowerCase().includes("inválidas") || errorText.toLowerCase().includes("usuario");

    recordResult("AUTH-01", "Validación de credenciales inválidas en Login", loginRechazado, {
      step: "Ingresar usuario inexistente y clave errónea en formulario de Login",
      expected: "Mostrar mensaje de error 'Credenciales inválidas' y denegar el acceso",
      obtained: errorText || "Sin mensaje visible",
    });

    // Login correcto
    await page.evaluate(() => {
      const inputs = document.querySelectorAll("input");
      inputs.forEach(i => (i.value = ""));
    });
    await page.type('input[autoComplete="username"], input[type="text"]', "admin");
    await page.type('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => sleep(1500));

    const currentUrl = page.url();
    const loginExitoso = !currentUrl.includes("/login");
    recordResult("AUTH-02", "Login exitoso con usuario administrador", loginExitoso, {
      step: "Ingresar usuario 'admin' y clave válida",
      expected: "Redireccionar a la pantalla principal ('/') con sesión iniciada",
      obtained: currentUrl,
    });

    // Obtener token almacenado
    const token = await page.evaluate(() => localStorage.getItem("token"));

    // Helper para llamadas API directas con token
    const fetchApi = async (endpoint, options = {}) => {
      return page.evaluate(async ({ endpoint, options, token }) => {
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        };
        const res = await fetch(`/api${endpoint}`, {
          ...options,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        const status = res.status;
        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        return { status, data };
      }, { endpoint, options, token });
    };

    // =========================================================================
    // ETAPA 1: CATÁLOGOS BASE Y MAESTROS (OBRAS SOCIALES Y PRÁCTICAS)
    // =========================================================================
    console.log("\n--- ETAPA 1: CATÁLOGOS BASE Y MAESTROS ---");

    // 1.1 Navegación a Obras Sociales
    await page.goto(`${BASE_URL}/configuracion/obras-sociales`, { waitUntil: "networkidle2" });
    await sleep(600);

    // 1.2 Crear una nueva Obra Social ("OSDE Test")
    const btnNuevaOS = await page.waitForSelector('button:has-text("Nueva Obra Social"), button:has(svg)');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.includes("Nueva Obra Social"));
      if (btn) btn.click();
    });
    await sleep(500);

    await page.type('input[name="nombre"]', "OSDE Test QA");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.trim() === "Crear");
      if (btn) btn.click();
    });
    await sleep(1000);

    const osCreadaEncontrada = await page.evaluate(() => {
      return document.body.textContent.includes("OSDE Test QA");
    });

    recordResult("ETAPA1-01", "Creación de nueva Obra Social ('OSDE Test QA')", osCreadaEncontrada, {
      step: "Abrir modal, ingresar nombre 'OSDE Test QA' y guardar",
      expected: "Obra social guardada exitosamente y visible en la grilla",
      obtained: osCreadaEncontrada ? "Obra social presente en grilla" : "No encontrada en la grilla",
    });

    // 1.3 Intentar crear duplicado con el mismo identificador/nombre
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.includes("Nueva Obra Social"));
      if (btn) btn.click();
    });
    await sleep(500);
    await page.type('input[name="nombre"]', "OSDE Test QA");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.trim() === "Crear");
      if (btn) btn.click();
    });
    await sleep(1000);

    // Verificar en BD si se creó duplicado
    const checkDuplicado = await fetchApi("/obras-sociales?limit=100");
    const osCoincidentes = checkDuplicado.data?.data?.filter(o => o.nombre === "OSDE Test QA") || [];
    const duplicadoRechazado = osCoincidentes.length === 1;

    recordResult("ETAPA1-02", "Rechazo de duplicados de Obra Social por mismo nombre", duplicadoRechazado, {
      step: "Intentar registrar nuevamente una Obra Social con el nombre exacto 'OSDE Test QA'",
      expected: "El sistema debe rechazar el duplicado (error 400 o 409) impidiendo duplicidad en base de datos",
      obtained: duplicadoRechazado 
        ? "Duplicado rechazado correctamente" 
        : `Se crearon múltiples registros con el mismo nombre (Total encontrados: ${osCoincidentes.length})`,
    });

    // 1.4 Validar campos numéricos de cobertura con valores ilógicos (ej. porcentaje negativo o > 100%)
    // Verificamos si la interfaz o el modelo posee dicho campo o si el backend lo valida
    const tieneCampoCoberturaUI = await page.evaluate(() => {
      return Boolean(document.querySelector('input[name*="porcentaje"], input[name*="cobertura"]'));
    });
    
    // Prueba de API para ver si el esquema o modelo soporta porcentaje
    const apiCoberturaNegativa = await fetchApi("/obras-sociales", {
      method: "POST",
      body: { nombre: "OS Cobertura Invalida", porcentaje_cobertura: -25, cobertura: 150 },
    });

    // El requerimiento pide: "Intenta guardar campos numéricos de cobertura con valores ilógicos (ej. porcentaje negativo o > 100%)."
    // En este sistema, la entidad ObraSocial solo cuenta con campos {id_obra_social, nombre, activo}.
    // Documentamos el resultado formalmente.
    recordResult("ETAPA1-03", "Validación de campos numéricos de cobertura en Obra Social", false, {
      step: "Inspeccionar inputs de porcentaje/cobertura en modal e intentar enviar valores ilógicos (-25%, >100%)",
      expected: "El formulario y backend deben exponer campo de cobertura numérica y rechazar porcentajes fuera del rango 0-100%",
      obtained: "El modelo y formulario de Obra Social NO disponen de campos de porcentaje/cobertura numérica (solo 'nombre' y 'activo'). La cobertura no está modelada a nivel catálogo de obra social.",
    });

    // 1.5 Edición de Obra Social y verificación de precarga por defecto
    const btnEditarOS = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("tr, div.rounded-2xl"));
      const targetRow = rows.find(r => r.textContent.includes("OSDE Test QA"));
      if (!targetRow) return false;
      const editBtn = targetRow.querySelector('button[title*="Editar"], button:has(svg.lucide-edit), button:has(svg)');
      if (editBtn) {
        editBtn.click();
        return true;
      }
      return false;
    });
    await sleep(600);

    const valorCargadoNombre = await page.evaluate(() => {
      const inp = document.querySelector('input[name="nombre"]');
      return inp ? inp.value : "";
    });

    const precargaCorrectaOS = valorCargadoNombre === "OSDE Test QA";

    // Modificamos el valor para verificar guardado
    if (precargaCorrectaOS) {
      await page.evaluate(() => {
        const inp = document.querySelector('input[name="nombre"]');
        if (inp) inp.value = "OSDE Test QA Modificada";
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        inp.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find(b => b.textContent.trim() === "Guardar");
        if (btn) btn.click();
      });
      await sleep(800);
    }

    recordResult("ETAPA1-04", "Edición de Obra Social y precarga de datos anteriores", precargaCorrectaOS, {
      step: "Abrir modal de edición sobre 'OSDE Test QA'",
      expected: "El input 'nombre' debe venir precargado exactamente con 'OSDE Test QA'",
      obtained: `Valor precargado: '${valorCargadoNombre}'`,
    });

    // 1.6 CRUD y validación de Prácticas
    console.log("\n--- CRUD Y VALIDACIÓN DE PRÁCTICAS ---");
    await page.goto(`${BASE_URL}/configuracion/practicas`, { waitUntil: "networkidle2" });
    await sleep(600);

    // Intentar dar de alta con arancel negativo y código vacío
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.includes("Nueva Práctica"));
      if (btn) btn.click();
    });
    await sleep(500);

    // Ingresar valores inválidos
    await page.type('input[name="codigo_nomenclador"]', "  "); // vacío o espacios
    await page.type('input[name="nombre_nomenclador"]', "Práctica Test Inválida");
    await page.type('input[name="nombre_referencia"]', "Práctica Test Inválida");
    await page.type('input[name="especialidad"]', "General");
    await page.type('input[name="precio_referencia"]', "-1500");

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.trim() === "Crear");
      if (btn) btn.click();
    });
    await sleep(800);

    // Verificar si la API o el frontend bloquearon el envío
    const testPracticaInvalidaApi = await fetchApi("/practicas", {
      method: "POST",
      body: {
        codigo_nomenclador: "",
        nombre_nomenclador: "Práctica Invalida",
        nombre_referencia: "Práctica Invalida",
        especialidad: "General",
        precio_referencia: -500,
      },
    });

    const bloqueaArancelNegativoYCodigoVacio = testPracticaInvalidaApi.status === 400;

    recordResult("ETAPA1-05", "Validación de aranceles negativos y códigos vacíos en Prácticas", bloqueaArancelNegativoYCodigoVacio, {
      step: "Enviar formulario con arancel -1500 y código nomenclador vacío",
      expected: "Rechazar con HTTP 400 (Zod schema validation) impidiendo el guardado",
      obtained: `Status HTTP recibido: ${testPracticaInvalidaApi.status} ${JSON.stringify(testPracticaInvalidaApi.data?.errors || testPracticaInvalidaApi.data)}`,
    });

    // Cerrar modal inválido si sigue abierto
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.trim() === "Cancelar");
      if (btn) btn.click();
    });
    await sleep(400);

    // Alta de Práctica válida
    const timestamp = Date.now().toString().slice(-4);
    const codigoValido = `09.${timestamp}`;
    const nombrePractica = `Extracción Molar QA ${timestamp}`;
    const arancelValido = 35000;

    const resAltaPractica = await fetchApi("/practicas", {
      method: "POST",
      body: {
        codigo_nomenclador: codigoValido,
        nombre_nomenclador: nombrePractica,
        nombre_referencia: nombrePractica,
        especialidad: "Cirugía",
        precio_referencia: arancelValido,
      },
    });

    const practicaCreadaOk = resAltaPractica.status === 201 && resAltaPractica.data?.data?.id_practica;
    const idPracticaCreada = resAltaPractica.data?.data?.id_practica;

    // Recargar vista para verificar renderizado
    await page.reload({ waitUntil: "networkidle2" });
    await sleep(600);

    const practicaEnGrilla = await page.evaluate((cod) => {
      return document.body.textContent.includes(cod);
    }, codigoValido);

    recordResult("ETAPA1-06", "Alta exitosa de Práctica con código y arancel base", practicaCreadaOk && practicaEnGrilla, {
      step: `Crear práctica con código '${codigoValido}' y arancel $${arancelValido}`,
      expected: "Práctica creada con status 201 y visible en la tabla",
      obtained: practicaCreadaOk && practicaEnGrilla 
        ? `Práctica #${idPracticaCreada} registrada y visible en UI`
        : `Falla en creación o renderizado. Status: ${resAltaPractica.status}`,
    });

    // =========================================================================
    // ETAPA 2: TABLAS INTERMEDIAS Y ASIGNACIONES CRUZADAS (RELACIONES N:M)
    // =========================================================================
    console.log("\n--- ETAPA 2: TABLAS INTERMEDIAS Y ASIGNACIONES CRUZADAS ---");

    // 2.1 Cobertura de Práctica por Obra Social
    // Verificar si existe módulo de asignación cruzada directa Obra Social <-> Práctica
    const rutaCoberturasExiste = await page.evaluate(async () => {
      const res = await fetch("/api/obras-sociales-practicas");
      return res.status !== 404;
    });

    recordResult("ETAPA2-01", "Configuración de cobertura estática de Práctica por Obra Social (N:M)", false, {
      step: "Consultar configuración de relación N:M fija de aranceles/porcentajes por Obra Social y Práctica",
      expected: "Módulo o grilla intermedia donde asociar qué prácticas cubre una obra social con sus porcentajes/montos",
      obtained: "No existe entidad ni tabla 'obra_social_practica' en el backend ni interfaz en frontend. El sistema modela la relación Obra Social únicamente a través del Turno atendido ('practica_turno') y del Paciente ('paciente_obra_social').",
    });

    // 2.2 Integridad referencial de asignación cruzada (PracticaTurno)
    // Crear turno de prueba, asociarle práctica y obra social, luego desasociar
    const resObraSocial = await fetchApi("/obras-sociales?limit=1");
    const idOSPrueba = resObraSocial.data?.data?.[0]?.id_obra_social || 1;

    // Crear paciente para las pruebas de turno
    const resPaciente = await fetchApi("/pacientes", {
      method: "POST",
      body: {
        nombre: `CarlosQA_${timestamp}`,
        apellido: "Automatizado",
        dni: `99${timestamp}`,
        telefono: "3517894561",
        domicilio: "Av Test 123",
      },
    });
    const idPacientePrueba = resPaciente.data?.data?.id_paciente;

    // Crear turno
    const fechaHoraInicio = "2026-11-20T10:00:00";
    const fechaHoraFin = "2026-11-20T10:30:00";
    const resTurno = await fetchApi("/turnos", {
      method: "POST",
      body: {
        id_paciente: idPacientePrueba,
        fecha_hora_inicio: fechaHoraInicio,
        fecha_hora_fin: fechaHoraFin,
        precio_final: arancelValido,
        notas_consulta: "Turno para pruebas de integridad cruzada",
      },
    });
    const idTurnoPrueba = resTurno.data?.data?.id_turno;

    // Asignar práctica y obra social en practica_turno
    const resAsignacion = await fetchApi("/practicas-turnos", {
      method: "POST",
      body: {
        id_turno: idTurnoPrueba,
        id_practica: idPracticaCreada,
        id_obra_social: idOSPrueba,
      },
    });
    const idRelacionPracticaTurno = resAsignacion.data?.data?.id_practica_turno;

    // Desasociar la relación
    const resDesasociacion = await fetchApi(`/practicas-turnos/${idRelacionPracticaTurno}`, {
      method: "DELETE",
    });

    // Verificar que la práctica base y la obra social base sigan intactas (integridad referencial)
    const checkPracticaBase = await fetchApi(`/practicas/${idPracticaCreada}`);
    const checkOSBase = await fetchApi(`/obras-sociales/${idOSPrueba}`);

    const integridadReferencialPreservada = 
      resDesasociacion.status === 200 && 
      checkPracticaBase.status === 200 && 
      checkOSBase.status === 200;

    recordResult("ETAPA2-02", "Integridad referencial al desvincular práctica de una asignación", integridadReferencialPreservada, {
      step: "Desvincular relación practica_turno y consultar entidades maestras asociadas",
      expected: "Eliminar el registro intermedio sin alterar la práctica global ni la obra social base",
      obtained: integridadReferencialPreservada
        ? "Relación intermedia eliminada. Práctica y Obra Social persisten intactas"
        : `Falla en verificación. Status practica: ${checkPracticaBase.status}, status OS: ${checkOSBase.status}`,
    });

    // 2.3 Vinculación Paciente - Obra Social (Alta, Cambio y Cascada)
    console.log("\n--- VINCULACIÓN PACIENTE - OBRA SOCIAL ---");
    await page.goto(`${BASE_URL}/pacientes`, { waitUntil: "networkidle2" });
    await sleep(600);

    // Asignar Obra Social inicial a paciente mediante API
    const nroAfiliadoInicial = `AFIL-${timestamp}`;
    const resAsignarOS = await fetchApi("/pacientes-por-obras-sociales", {
      method: "POST",
      body: {
        id_paciente: idPacientePrueba,
        id_obra_social: idOSPrueba,
        nro_afiliado: nroAfiliadoInicial,
      },
    });
    const idRelacionPacienteOS = resAsignarOS.data?.data?.id_paciente_obra_social;

    // Verificar que se cargue la relación
    const resConsultaOSPaciente = await fetchApi(`/pacientes-por-obras-sociales/${idPacientePrueba}`);
    const osAsociadaCorrectamente = resConsultaOSPaciente.data?.data?.some(
      r => r.id_obra_social === idOSPrueba && r.nro_afiliado === nroAfiliadoInicial
    );

    // Modificar / actualizar obra social del paciente (cambiar de obra social y número de credencial)
    const resObrasSociales = await fetchApi("/obras-sociales?limit=5");
    const otraOS = resObrasSociales.data?.data?.find(o => o.id_obra_social !== idOSPrueba);
    const idOtraOS = otraOS ? otraOS.id_obra_social : idOSPrueba;
    const nuevoNroAfiliado = `NUEVO-AFIL-${timestamp}`;

    const resActualizarOS = await fetchApi(`/pacientes-por-obras-sociales/${idRelacionPacienteOS}`, {
      method: "PUT",
      body: {
        id_paciente: idPacientePrueba,
        id_obra_social: idOtraOS,
        nro_afiliado: nuevoNroAfiliado,
      },
    });

    const resConsultaActualizada = await fetchApi(`/pacientes-por-obras-sociales/${idPacientePrueba}`);
    const datosActualizadosCascada = resConsultaActualizada.data?.data?.some(
      r => r.id_obra_social === idOtraOS && r.nro_afiliado === nuevoNroAfiliado
    );

    recordResult("ETAPA2-03", "Vinculación y actualización en cascada Paciente - Obra Social", osAsociadaCorrectamente && datosActualizadosCascada, {
      step: `Asignar OS #${idOSPrueba} (Afiliado: ${nroAfiliadoInicial}) y luego cambiar a OS #${idOtraOS} (${nuevoNroAfiliado})`,
      expected: "La relación N:M debe registrar la afiliación y actualizar de forma coherente los datos en cascada",
      obtained: datosActualizadosCascada 
        ? `Datos actualizados correctamente a OS #${idOtraOS} con credencial ${nuevoNroAfiliado}`
        : "No se reflejó la actualización coherente de la relación",
    });

    // =========================================================================
    // ETAPA 3: AGENDA, TURNOS Y VALIDACIÓN TEMPORAL
    // =========================================================================
    console.log("\n--- ETAPA 3: AGENDA, TURNOS Y VALIDACIÓN TEMPORAL ---");

    // 3.1 Solapamiento y reglas de negocio: Dos turnos en el mismo horario
    // Turno base ya creado: fechaHoraInicio ('2026-11-20T10:00:00') a ('2026-11-20T10:30:00')
    // Intentamos agendar un segundo turno que se solape (ej. 10:15 a 10:45)
    const resSolapamiento = await fetchApi("/turnos", {
      method: "POST",
      body: {
        id_paciente: 1, // Otro paciente
        fecha_hora_inicio: "2026-11-20T10:15:00",
        fecha_hora_fin: "2026-11-20T10:45:00",
        precio_final: 20000,
        notas_consulta: "Turno superpuesto de prueba",
      },
    });

    const abortaConAlertaSolapamiento = resSolapamiento.status === 409;
    const mensajeSolapamiento = resSolapamiento.data?.error || "";

    recordResult("ETAPA3-01", "Detección y aborto por solapamiento de horarios de Turnos", abortaConAlertaSolapamiento, {
      step: "Intentar agendar turno superpuesto (10:15 - 10:45) sobre turno existente (10:00 - 10:30)",
      expected: "Abortar creación respondiendo HTTP 409 con mensaje claro de error",
      obtained: `HTTP ${resSolapamiento.status}: "${mensajeSolapamiento}"`,
    });

    // 3.2 Filtro y autocompletado en tiempo real en selector de Pacientes (InputFiltro)
    await page.goto(`${BASE_URL}/turnos`, { waitUntil: "networkidle2" });
    await sleep(600);

    // Abrir modal de nuevo turno
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.includes("Nuevo Turno") || b.textContent.includes("Agendar"));
      if (btn) btn.click();
    });
    await sleep(500);

    // Escribir en el selector de paciente
    const selectorPaciente = 'input[placeholder*="paciente"]';
    await page.waitForSelector(selectorPaciente, { timeout: 3000 });
    await page.type(selectorPaciente, "CarlosQA");
    await sleep(400);

    // Verificar si el dropdown muestra la opción filtrada
    const sugerenciasVisibles = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("div, li, button")).filter(
        el => el.textContent.includes("CarlosQA") && el.textContent.includes("DNI:")
      );
      return items.length > 0;
    });

    // Hacer click en la opción sugerida
    let opcionSeleccionadaOk = false;
    if (sugerenciasVisibles) {
      opcionSeleccionadaOk = await page.evaluate(() => {
        const item = Array.from(document.querySelectorAll("div, li, button")).find(
          el => el.textContent.includes("CarlosQA") && el.textContent.includes("DNI:")
        );
        if (item) {
          item.click();
          return true;
        }
        return false;
      });
      await sleep(300);
    }

    const valorInputPoblado = await page.$eval(selectorPaciente, el => el.value);
    const autocompletadoExitoso = valorInputPoblado.includes("CarlosQA");

    recordResult("ETAPA3-02", "Filtro en tiempo real y autocompletado en selector de Paciente", autocompletadoExitoso, {
      step: "Ingresar 'CarlosQA' en selector y hacer click en la opción desplegada",
      expected: "El selector debe filtrar en vivo y al seleccionar debe poblar automáticamente el valor",
      obtained: `Valor en el input: '${valorInputPoblado}'`,
    });

    // Cerrar modal de nuevo turno
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.trim() === "Cancelar");
      if (btn) btn.click();
    });
    await sleep(400);

    // 3.3 Edición y persistencia de Turno: verificar precarga de datos sin 'undefined'
    // Abrir modal de edición del turno previamente creado
    await page.goto(`${BASE_URL}/turnos`, { waitUntil: "networkidle2" });
    await sleep(600);

    // Buscar el turno creado en la grilla y hacer click en Editar
    const btnEditarTurno = await page.evaluate((idT) => {
      const filas = Array.from(document.querySelectorAll("tr, div.rounded-2xl"));
      const fila = filas.find(f => f.textContent.includes(`#${idT}`) || f.textContent.includes("CarlosQA"));
      if (fila) {
        const btn = fila.querySelector('button[title*="Editar"], button:has(svg.lucide-edit), button:has(svg)');
        if (btn) {
          btn.click();
          return true;
        }
      }
      return false;
    }, idTurnoPrueba);
    await sleep(700);

    // Verificar inputs precargados
    const datosPrecargaTurno = await page.evaluate(() => {
      const pacienteInput = document.querySelector('input[placeholder*="paciente"]')?.value || "";
      const notasInput = document.querySelector('textarea[name="notas_consulta"]')?.value || "";
      return { pacienteInput, notasInput };
    });

    const sinUndefined = 
      !datosPrecargaTurno.pacienteInput.includes("undefined") && 
      !datosPrecargaTurno.notasInput.includes("undefined") &&
      datosPrecargaTurno.pacienteInput.length > 0;

    recordResult("ETAPA3-03", "Edición y persistencia: precarga de Turno sin 'undefined'", sinUndefined, {
      step: `Abrir modal de edición para el Turno #${idTurnoPrueba}`,
      expected: "Campos de paciente, horarios y notas precargados con valores reales y sin 'undefined'",
      obtained: JSON.stringify(datosPrecargaTurno),
    });

    // Cerrar modal de edición
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.trim() === "Cancelar");
      if (btn) btn.click();
    });
    await sleep(400);

    // =========================================================================
    // ETAPA 4: FINANZAS, COBROS Y GESTIÓN DE CUOTAS
    // =========================================================================
    console.log("\n--- ETAPA 4: FINANZAS, COBROS Y GESTIÓN DE CUOTAS ---");

    // 4.1 Marcar turno como Atendido para poder cobrarlo
    // Pasamos el turno a estado 'Atendido' (id_estado = 3) y asociamos práctica
    const resAtenderTurno = await fetchApi(`/turnos/${idTurnoPrueba}/atender`, {
      method: "PATCH",
      body: {
        precio_final: 30000,
        notas_consulta: "Atención finalizada con limpieza y extracción",
        practicas: [
          { id_practica: idPracticaCreada, id_obra_social: idOSPrueba }
        ],
      },
    });

    // 4.2 Generación de Cobro a partir de Turno/Práctica
    // Navegar a Caja / Balance
    await page.goto(`${BASE_URL}/caja`, { waitUntil: "networkidle2" });
    await sleep(600);

    // Crear cobro de prueba con plan de 3 cuotas fijas por $30,000.00
    const saldoTotalFinanciar = 30000.00;
    const cantCuotas = 3;
    const resCrearCobroCuotas = await fetchApi("/cobros/cuotas", {
      method: "POST",
      body: {
        id_turno: idTurnoPrueba,
        id_paciente: idPacientePrueba,
        monto_a_cobrar: saldoTotalFinanciar,
        cant_cuotas: cantCuotas,
        fecha_primer_vencimiento: "2026-11-25",
      },
    });

    const cobroCreadoOk = resCrearCobroCuotas.status === 201 && resCrearCobroCuotas.data?.data?.id_cobro;
    const idCobroCreado = resCrearCobroCuotas.data?.data?.id_cobro;

    recordResult("ETAPA4-01", "Generación de Cobro a partir de Turno Atendido", cobroCreadoOk, {
      step: `Crear cobro para Turno #${idTurnoPrueba} por monto total $${saldoTotalFinanciar}`,
      expected: "Cobro creado con status 201 vinculado al turno y paciente",
      obtained: cobroCreadoOk ? `Cobro #${idCobroCreado} generado exitosamente` : `Error: status ${resCrearCobroCuotas.status}`,
    });

    // 4.3 Módulo de Cuotas: División en 3 cuotas y suma exacta (sin desfasaje de centavos)
    const resCuotas = await fetchApi(`/cuotas/${idCobroCreado}/cuotas`);
    const listaCuotas = resCuotas.data?.data || [];

    let sumaCuotas = 0;
    listaCuotas.forEach(c => {
      sumaCuotas += parseFloat(c.monto_cuota);
    });

    const sumaCuotasExacta = Math.abs(sumaCuotas - saldoTotalFinanciar) < 0.001 && listaCuotas.length === cantCuotas;

    recordResult("ETAPA4-02", "División en X cuotas y suma exacta sin desfasaje de centavos", sumaCuotasExacta, {
      step: `Dividir $${saldoTotalFinanciar} en ${cantCuotas} cuotas`,
      expected: `La suma de las ${cantCuotas} cuotas debe ser idéntica a $${saldoTotalFinanciar.toFixed(2)}`,
      obtained: `Cuotas generadas: ${listaCuotas.length}, suma total calculada: $${sumaCuotas.toFixed(2)} [${listaCuotas.map(c => c.monto_cuota).join(", ")}]`,
    });

    // 4.4 Simular el pago de la Cuota 1:
    // - Debe cambiar de estado a "Pagada" con su fecha_cobro
    // - Las cuotas restantes deben mantenerse en estado "Pendiente"
    const cuota1 = listaCuotas[0];
    const cuota2 = listaCuotas[1];
    const cuota3 = listaCuotas[2];

    const montoCuota1 = parseFloat(cuota1.monto_cuota);
    const fechaHoy = new Date().toISOString().split("T")[0];

    const resCobrarCuota1 = await fetchApi(`/cuotas/${cuota1.id_cuota}/cobrar`, {
      method: "PATCH",
      body: {
        monto_cobrado: montoCuota1,
        fecha_cobro: fechaHoy,
        metodo_pago: "Efectivo",
      },
    });

    // Consultar estado de todas las cuotas post pago
    const resCuotasPostPago = await fetchApi(`/cuotas/${idCobroCreado}/cuotas`);
    const listaCuotasPost = resCuotasPostPago.data?.data || [];
    const c1Post = listaCuotasPost.find(c => c.id_cuota === cuota1.id_cuota);
    const c2Post = listaCuotasPost.find(c => c.id_cuota === cuota2.id_cuota);
    const c3Post = listaCuotasPost.find(c => c.id_cuota === cuota3.id_cuota);

    const c1PagadaOk = c1Post?.estado === "Pagada" && Boolean(c1Post?.fecha_cobro);
    const restantesPendientes = c2Post?.estado === "Pendiente" && c3Post?.estado === "Pendiente";

    recordResult("ETAPA4-03", "Pago de Cuota 1: cambio a 'Pagada' y persistencia de 'Pendiente' en restantes", c1PagadaOk && restantesPendientes, {
      step: `Asentar pago de Cuota 1 ($${montoCuota1})`,
      expected: "Cuota 1 pasa a 'Pagada' con fecha; Cuotas 2 y 3 se mantienen en 'Pendiente'",
      obtained: `Cuota 1: ${c1Post?.estado} (${c1Post?.fecha_cobro}) | Cuota 2: ${c2Post?.estado} | Cuota 3: ${c3Post?.estado}`,
    });

    // 4.5 Bloqueo de sobrepagos accidentales: intentar pagar más del monto adeudado
    const montoExcesivo = parseFloat(cuota2.monto_cuota) + 5000;
    const resSobrepago = await fetchApi(`/cuotas/${cuota2.id_cuota}/cobrar`, {
      method: "PATCH",
      body: {
        monto_cobrado: montoExcesivo,
        fecha_cobro: fechaHoy,
        metodo_pago: "Transferencia",
      },
    });

    const sobrepagoBloqueado = resSobrepago.status === 400;
    const mensajeSobrepago = resSobrepago.data?.message || resSobrepago.data?.error || "";

    recordResult("ETAPA4-04", "Bloqueo de sobrepagos accidentales en cuotas", sobrepagoBloqueado, {
      step: `Intentar cobrar $${montoExcesivo} en una cuota de $${cuota2.monto_cuota}`,
      expected: "El sistema debe rechazar con HTTP 400 impidiendo cobrar un monto mayor a la cuota",
      obtained: `HTTP ${resSobrepago.status}: "${mensajeSobrepago}"`,
    });

    // =========================================================================
    // ETAPA 5: VALIDACIONES DE UI, FILTROS Y ESTADO GLOBAL
    // =========================================================================
    console.log("\n--- ETAPA 5: VALIDACIONES DE UI, FILTROS Y ESTADO GLOBAL ---");

    // 5.1 Reactividad de inputs de filtrado en Pacientes
    await page.goto(`${BASE_URL}/pacientes`, { waitUntil: "networkidle2" });
    await sleep(600);

    const inputBusquedaPaciente = 'input[placeholder*="Buscar"]';
    await page.waitForSelector(inputBusquedaPaciente, { timeout: 3000 });
    
    // Contar filas antes de filtrar
    const totalFilasOriginal = await page.evaluate(() => {
      return document.querySelectorAll("tbody tr, div.rounded-2xl.border").length;
    });

    // Escribir término de búsqueda único
    await page.type(inputBusquedaPaciente, `CarlosQA_${timestamp}`);
    await sleep(600);

    const totalFilasFiltradas = await page.evaluate(() => {
      return document.querySelectorAll("tbody tr, div.rounded-2xl.border").length;
    });

    // Limpiar input y verificar restablecimiento sin recargar
    await page.evaluate((sel) => {
      const input = document.querySelector(sel);
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, inputBusquedaPaciente);
    await sleep(600);

    const totalFilasRestablecidas = await page.evaluate(() => {
      return document.querySelectorAll("tbody tr, div.rounded-2xl.border").length;
    });

    const filtroReactivoOk = totalFilasFiltradas >= 1 && totalFilasRestablecidas >= totalFilasFiltradas;

    recordResult("ETAPA5-01", "Reactividad de filtros de búsqueda sin recarga de página (Pacientes)", filtroReactivoOk, {
      step: `Filtrar por 'CarlosQA_${timestamp}', verificar reducción de lista y limpiar input`,
      expected: "Filtrar en vivo y restablecer lista original al limpiar sin recargar la página",
      obtained: `Original: ${totalFilasOriginal} -> Filtrado: ${totalFilasFiltradas} -> Restablecido: ${totalFilasRestablecidas}`,
    });

    // 5.2 Manejo de borrados dependientes (Foreign Keys): Intentar borrar entidad con registros asociados
    console.log("\n--- MANEJO DE BORRADOS DEPENDIENTES (FOREIGN KEYS) ---");

    // Intentar borrar la práctica que tiene turnos/cobros asociados
    const resBorradoPracticaDependiente = await fetchApi(`/practicas/${idPracticaCreada}/delete`, {
      method: "DELETE",
    });

    // Comprobar respuesta: si tiene FK activa, debe rechazar con 500/400 de forma controlada o bloquear
    const borradoControlado = resBorradoPracticaDependiente.status >= 400;

    // Verificar en la UI que la página siga operativa y no se quede en blanco (sin crash de JS)
    await page.goto(`${BASE_URL}/configuracion/practicas`, { waitUntil: "networkidle2" });
    await sleep(500);
    const uiVivaSinCrash = await page.evaluate(() => {
      return document.body.textContent.includes("Catálogo de Prácticas") && document.querySelectorAll("button").length > 0;
    });

    recordResult("ETAPA5-02", "Control elegante de borrado dependiente de Práctica (FK)", borradoControlado && uiVivaSinCrash, {
      step: `Intentar eliminar Práctica #${idPracticaCreada} con registros en 'practica_turno'`,
      expected: "Impedir borrado destructivo o controlar error sin crash de pantalla blanca de JavaScript",
      obtained: `Respuesta de eliminación: HTTP ${resBorradoPracticaDependiente.status}. UI operativa sin crash: ${uiVivaSinCrash}`,
    });

    // Intentar dar de baja al paciente con turnos/cobros asociados (Soft-delete)
    const resBajaPaciente = await fetchApi(`/pacientes/${idPacientePrueba}/delete`, {
      method: "PATCH",
    });

    const softDeletePacienteOk = resBajaPaciente.status === 200;
    recordResult("ETAPA5-03", "Baja lógica controlada (Soft-delete) de Paciente con historial", softDeletePacienteOk, {
      step: `Ejecutar PATCH /pacientes/${idPacientePrueba}/delete en paciente con turnos y cobros`,
      expected: "Aplicar soft-delete (activo: false) preservando la integridad histórica de turnos y finanzas",
      obtained: `Respuesta: HTTP ${resBajaPaciente.status} (${resBajaPaciente.data?.message || "OK"})`,
    });

    // =========================================================================
    // EXPLORACIÓN Y TESTEO EXHAUSTIVO (COBERTURA TOTAL)
    // =========================================================================
    console.log("\n--- EXPLORACIÓN Y TESTEO EXHAUSTIVO DEL SISTEMA ---");

    // EXP-01: Navegación por todas las rutas del menú lateral
    const rutas = [
      { ruta: "/", tituloEsperado: "Agenda" },
      { ruta: "/turnos", tituloEsperado: "Turnos" },
      { ruta: "/pacientes", tituloEsperado: "Pacientes" },
      { ruta: "/caja", tituloEsperado: "Balance" },
      { ruta: "/configuracion/obras-sociales", tituloEsperado: "Obras Sociales" },
      { ruta: "/configuracion/practicas", tituloEsperado: "Prácticas" },
      { ruta: "/configuracion/horarios", tituloEsperado: "Horarios" },
    ];

    let todasLasRutasOk = true;
    for (const r of rutas) {
      await page.goto(`${BASE_URL}${r.ruta}`, { waitUntil: "networkidle2" });
      await sleep(400);
      const textoPagina = await page.evaluate(() => document.body.textContent);
      if (!textoPagina.includes(r.tituloEsperado)) {
        todasLasRutasOk = false;
        consoleErrors.push(`Fallo en ruta ${r.ruta}: no contiene '${r.tituloEsperado}'`);
      }
    }

    recordResult("EXP-01", "Navegabilidad completa por todas las vistas del Sidebar y Configuración", todasLasRutasOk, {
      step: "Visitar secuencialmente: Agenda, Turnos, Pacientes, Balance, Obras Sociales, Prácticas y Horarios",
      expected: "Todas las páginas deben cargar correctamente sin excepciones ni pantallas en blanco",
      obtained: todasLasRutasOk ? "100% de rutas cargadas exitosamente" : "Fallo en alguna ruta",
    });

    // EXP-02: Módulo de Gastos en Caja (Formulario con validación de montos negativos y categorías)
    await page.goto(`${BASE_URL}/caja`, { waitUntil: "networkidle2" });
    await sleep(500);

    // Obtener categorías de gastos existentes
    const resCategorias = await fetchApi("/categorias-gastos");
    const listaCategorias = resCategorias.data?.data || [];
    const idCategoriaPrueba = listaCategorias[0]?.id_categoria_gasto || 1;

    // Intentar registrar gasto inválido con monto negativo
    const resGastoInvalido = await fetchApi("/gastos", {
      method: "POST",
      body: {
        id_categoria_gasto: idCategoriaPrueba,
        monto: -5000,
        descripcion: "Gasto inválido negativo",
        fecha: fechaHoy,
      },
    });
    const gastoInvalidoBloqueado = resGastoInvalido.status === 400;

    // Registrar gasto válido
    const resGastoValido = await fetchApi("/gastos", {
      method: "POST",
      body: {
        id_categoria_gasto: idCategoriaPrueba,
        monto: 12500,
        descripcion: `Compra de insumos odontológicos QA ${timestamp}`,
        fecha: fechaHoy,
      },
    });
    const gastoValidoOk = resGastoValido.status === 201;

    recordResult("EXP-02", "Módulo de Gastos: rechazo de montos negativos y registro exitoso", gastoInvalidoBloqueado && gastoValidoOk, {
      step: "Probar validación de arancel negativo en gasto y posteriormente alta válida",
      expected: "Rechazar monto <= 0 con HTTP 400 y permitir alta válida con HTTP 201",
      obtained: `Gasto negativo status: ${resGastoInvalido.status} | Gasto válido status: ${resGastoValido.status}`,
    });

    // EXP-03: Pestañas de Vista en Balance de Caja (Cronológica, Libro Mayor, Pendientes)
    await page.goto(`${BASE_URL}/caja`, { waitUntil: "networkidle2" });
    await sleep(600);

    const pestanasCajaOk = await page.evaluate(async () => {
      const botones = Array.from(document.querySelectorAll("button"));
      
      // Click en Libro Mayor
      const btnMayor = botones.find(b => b.textContent.includes("Libro Mayor") || b.textContent.includes("Mayor"));
      if (btnMayor) btnMayor.click();
      await new Promise(r => setTimeout(r, 400));
      const paso1 = document.body.textContent.includes("Categoría") || document.body.textContent.includes("Saldo");

      // Click en Pendientes
      const btnPendientes = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Pendientes"));
      if (btnPendientes) btnPendientes.click();
      await new Promise(r => setTimeout(r, 400));
      const paso2 = document.body.textContent.includes("Pendiente") || document.body.textContent.includes("Cuota");

      // Volver a Cronológico
      const btnCrono = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Cronológico"));
      if (btnCrono) btnCrono.click();
      await new Promise(r => setTimeout(r, 400));

      return paso1 && paso2;
    });

    recordResult("EXP-03", "Conmutación de pestañas en módulo Balance (Cronológico, Libro Mayor, Pendientes)", pestanasCajaOk, {
      step: "Alternar entre las pestañas de Balance de Caja y verificar actualización reactiva del DOM",
      expected: "Conmutar sin errores de JS ni pérdida de estado",
      obtained: pestanasCajaOk ? "Pestañas conmutan y renderizan correctamente" : "Fallo en alguna pestaña",
    });

    // EXP-04: Gestión de Horarios de Atención (Configuración)
    await page.goto(`${BASE_URL}/configuracion/horarios`, { waitUntil: "networkidle2" });
    await sleep(600);

    const configuracionHorariosOk = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="time"], select');
      return inputs.length > 0;
    });

    recordResult("EXP-04", "Disponibilidad del panel de Configuración de Horarios", configuracionHorariosOk, {
      step: "Acceder a /configuracion/horarios e interactuar con inputs de rangos horarios",
      expected: "Panel accesible con selectores de días y horarios laborales",
      obtained: configuracionHorariosOk ? "Panel y controles horarios disponibles" : "Controles no encontrados",
    });

    // EXP-05: Modal de Cambio de Contraseña de Usuario
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    await sleep(500);

    // Abrir modal de cambio de contraseña desde el avatar/botón de usuario
    const modalPasswordDisponible = await page.evaluate(() => {
      // Buscar botón de perfil o cambio de contraseña
      const btns = Array.from(document.querySelectorAll("button"));
      const btnUser = btns.find(b => b.textContent.includes("admin") || b.title?.includes("Usuario") || b.querySelector(".lucide-lock, .lucide-key-round"));
      if (btnUser) {
        btnUser.click();
        return true;
      }
      return false;
    });
    await sleep(400);

    // Test de API de cambio de contraseña con contraseña actual incorrecta
    const resCambioPassInvalida = await fetchApi("/usuarios/cambiar-password", {
      method: "PUT",
      body: {
        password_actual: "clave_totalmente_incorrecta",
        nueva_password: "NuevaClaveSegura2026!",
      },
    });

    const rechazoPasswordInvalida = resCambioPassInvalida.status === 400 || resCambioPassInvalida.status === 401;

    recordResult("EXP-05", "Seguridad: verificación estricta de contraseña actual en cambio de credenciales", rechazoPasswordInvalida, {
      step: "Intentar actualizar credenciales enviando contraseña actual errónea",
      expected: "Denegar la operación con HTTP 400/401 impidiendo la vulneración de la cuenta",
      obtained: `Respuesta HTTP: ${resCambioPassInvalida.status} (${resCambioPassInvalida.data?.mensaje || resCambioPassInvalida.data?.message || "Rechazado"})`,
    });

    // EXP-06: Verificación de ausencia de excepciones críticas y fugas no controladas en consola
    const huboErroresConsola = consoleErrors.length > 0;
    recordResult("EXP-06", "Integridad de consola del navegador y ausencia de uncaught exceptions", !huboErroresConsola, {
      step: "Revisar logs de consola acumulados durante toda la ejecución de la suite",
      expected: "0 errores de JavaScript y 0 excepciones no controladas",
      obtained: huboErroresConsola ? `Se detectaron ${consoleErrors.length} errores:\n${consoleErrors.slice(0, 5).join("\n")}` : "0 excepciones no controladas",
    });

  } catch (err) {
    console.error("FATAL ERROR EN SUITE:", err);
  } finally {
    if (browser) await browser.close();
  }

  // =========================================================================
  // GENERAR ARCHIVO resultadoTests.txt
  // =========================================================================
  console.log("\n=== GENERANDO ARCHIVO resultadoTests.txt ===");

  let txt = "================================================================================\n";
  txt += "        INFORME DE EJECUCIÓN DE PRUEBAS END-TO-END (QA AUTOMATION SENIOR)       \n";
  txt += "================================================================================\n";
  txt += `Fecha de ejecución : ${new Date().toLocaleString("es-AR")}\n`;
  txt += `URL Base Evaluada  : ${BASE_URL}\n`;
  txt += `API Backend        : ${API_URL}\n`;
  txt += `Navegador / Engine : Microsoft Edge (Chromium Engine / Puppeteer-Core)\n`;
  txt += "================================================================================\n\n";

  const total = results.length;
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const porcentaje = ((passed / total) * 100).toFixed(1);

  txt += `RESUMEN EJECUTIVO:\n`;
  txt += `Total de Escenarios Evaluados : ${total}\n`;
  txt += `Aprobados [PASS]              : ${passed}\n`;
  txt += `Fallidos / Discrepancias [FAIL]: ${failed}\n`;
  txt += `Tasa de Aprobación            : ${porcentaje}%\n\n`;
  txt += "--------------------------------------------------------------------------------\n\n";

  results.forEach((r, idx) => {
    txt += `[${r.status}] [${r.code}] ${r.title}\n`;
    if (r.status === "FAIL") {
      txt += `  - 1. Paso exacto donde falló:\n       ${r.step}\n`;
      txt += `  - 2. Comportamiento esperado:\n       ${r.expected}\n`;
      txt += `  - 3. Comportamiento obtenido:\n       ${r.obtained}\n`;
      if (r.consoleErrors && r.consoleErrors.length > 0) {
        txt += `  - 4. Errores de consola del navegador:\n`;
        r.consoleErrors.forEach(ce => {
          txt += `       * ${ce}\n`;
        });
      }
      if (r.networkFailures && r.networkFailures.length > 0) {
        txt += `  - 5. Peticiones fallidas de red (HTTP 4xx/5xx):\n`;
        r.networkFailures.forEach(nf => {
          txt += `       * ${nf}\n`;
        });
      }
    } else {
      txt += `  - Paso ejecutado: ${r.step}\n`;
      txt += `  - Resultado: ${r.obtained}\n`;
    }
    txt += "\n";
  });

  txt += "================================================================================\n";
  txt += "                               FIN DEL INFORME                                  \n";
  txt += "================================================================================\n";

  fs.writeFileSync("resultadoTests.txt", txt, "utf8");
  console.log("¡Archivo resultadoTests.txt generado con éxito!");
}

runSuite().catch(console.error);

