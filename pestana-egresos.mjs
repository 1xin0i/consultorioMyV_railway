// Unifica el id de la pestaña de egresos en Movimientos: "gastos" -> "egresos".
// Uso, desde la carpeta raíz del repo:   node pestana-egresos.mjs
// Para ver qué haría sin modificar nada: node pestana-egresos.mjs --probar
import fs from "node:fs";

const soloProbar = process.argv.includes("--probar");
const BASE = "frontend/src/features/caja/";

// [archivo, texto viejo, texto nuevo]: se reemplazan todas las apariciones
const CAMBIOS = [
  ["components/CajaToolbar.jsx", 'id: "gastos"', 'id: "egresos"'],
  ["pages/GestionCaja.jsx", 'vistaActiva === "gastos"', 'vistaActiva === "egresos"'],
  ["hooks/useMovimientosCaja.jsx", 'vistaActiva === "gastos"', 'vistaActiva === "egresos"'],
];

if (!fs.existsSync(BASE)) {
  console.error("Ejecutá el script desde la raíz del repo (donde está la carpeta frontend).");
  process.exit(1);
}

let problemas = 0;
for (const [archivo, viejo, nuevo] of CAMBIOS) {
  const ruta = BASE + archivo;
  if (!fs.existsSync(ruta)) {
    console.log(`  - ${archivo}: no existe`);
    problemas++;
    continue;
  }
  const texto = fs.readFileSync(ruta, "utf8");
  const veces = texto.split(viejo).length - 1;
  const yaNuevos = texto.split(nuevo).length - 1;

  if (veces > 0) {
    if (!soloProbar) fs.writeFileSync(ruta, texto.split(viejo).join(nuevo), "utf8");
    console.log(`  ✔ ${archivo}: ${veces} ${veces === 1 ? "cambio" : "cambios"}`);
  } else if (yaNuevos > 0) {
    console.log(`  · ${archivo}: ya decía "egresos"`);
  } else {
    console.log(`  ✘ ${archivo}: no encontré ${viejo} ni ${nuevo}`);
    problemas++;
  }
}

console.log(soloProbar ? "\nMODO PRUEBA: no se modificó ningún archivo." : "\nListo.");
if (problemas > 0) console.log(`Hay ${problemas} archivo(s) para revisar a mano.`);
