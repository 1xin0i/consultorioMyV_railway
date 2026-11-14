/** @format */

export const obtenerCamposFaltantesPaciente = (p) => {
  if (!p) return [];
  const faltantes = [];
  if (!p.dni || String(p.dni).trim() === "") {
    faltantes.push({ key: "dni", label: "DNI" });
  }
  if (!p.fecha_nacimiento) {
    faltantes.push({ key: "fecha_nacimiento", label: "Fecha Nac." });
  }
  if (!p.domicilio || String(p.domicilio).trim() === "") {
    faltantes.push({ key: "domicilio", label: "Domicilio" });
  }
  if (!p.telefono || String(p.telefono).trim() === "") {
    faltantes.push({ key: "telefono", label: "Teléfono" });
  }
  return faltantes;
};

export const esPacienteIncompleto = (p) => {
  return p?.activo !== false && obtenerCamposFaltantesPaciente(p).length > 0;
};

