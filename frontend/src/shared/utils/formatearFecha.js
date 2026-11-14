/** @format */

const formatDateTime = (fechaString) => {
  if (!fechaString) return "-";
  const fecha = new Date(fechaString);
  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatDate = (fechaString) => {
  if (!fechaString) return "-";

  // Evitamos que el navegador reste horas por la zona horaria en fechas "YYYY-MM-DD"
  const partes = fechaString.split("T")[0].split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`; // Retorna DD/MM/YYYY directo
  }

  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateInput = (fechaString) => {
  if (!fechaString) return "";
  return fechaString.split("T")[0];
};

const formatDateTimeInput = (fechaString) => {
  if (!fechaString) return "";

  const fecha = new Date(fechaString);
  if (isNaN(fecha.getTime())) return "";

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  const horas = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");

  return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
};

const formatFechaCortaTexto = (fecha = new Date()) => {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (!d || isNaN(d.getTime())) return "";
  const opciones = { weekday: "long", day: "numeric", month: "long" };
  const texto = d.toLocaleDateString("es-AR", opciones);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export {
  formatDateTime,
  formatDate,
  formatDateInput,
  formatDateTimeInput,
  formatFechaCortaTexto,
};

