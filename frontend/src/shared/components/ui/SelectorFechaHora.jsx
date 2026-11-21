/** @format */

import { useMemo } from "react";

const dosDigitos = (n) => String(n).padStart(2, "0");

const fechaLocalStr = (d) =>
  `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;

const aMinutos = (horaStr, fallback) => {
  const [h, m] = String(horaStr || "").split(":").map(Number);
  return isNaN(h) ? fallback : h * 60 + (m || 0);
};

const aHora = (min) => `${dosDigitos(Math.floor(min / 60))}:${dosDigitos(min % 60)}`;

/**
 * Fecha + hora de un turno, en dos campos: un calendario para el día
 * y una lista de horarios cada 15 minutos (o el paso indicado) dentro de la jornada.
 * Devuelve el valor como "AAAA-MM-DDTHH:mm" con un evento { target: { name, value } },
 * igual que un input común, para no cambiar los formularios que lo usan.
 */
export default function SelectorFechaHora({
  name,
  value,
  onChange,
  horaInicio = "08:00",
  horaFin = "20:00",
  paso = 15,
  permitirPasado = false,
  invalido = false,
  required = false,
  className = "",
}) {
  const [fecha = "", horaRaw = ""] = String(value || "").split("T");
  const hora = horaRaw.slice(0, 5);
  const hoyStr = fechaLocalStr(new Date());

  const opciones = useMemo(() => {
    const ini = aMinutos(horaInicio, 8 * 60);
    const fin = aMinutos(horaFin, 20 * 60);
    const ahora = new Date();
    const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const esHoy = fecha === hoyStr;
    const lista = [];
    for (let m = ini; m < fin; m += paso) {
      lista.push({
        hora: aHora(m),
        pasada: !permitirPasado && esHoy && m < minAhora,
      });
    }
    // Si el turno ya tenía un horario fuera de la lista (ej. 10:10), se conserva.
    if (hora && !lista.some((o) => o.hora === hora)) {
      lista.push({ hora, pasada: false });
      lista.sort((a, b) => a.hora.localeCompare(b.hora));
    }
    return lista;
  }, [horaInicio, horaFin, paso, fecha, hoyStr, hora, permitirPasado]);

  const emitir = (nuevaFecha, nuevaHora) => {
    onChange?.({
      target: {
        name,
        value: nuevaFecha && nuevaHora ? `${nuevaFecha}T${nuevaHora}` : "",
      },
    });
  };

  const cambiarFecha = (e) => {
    const nuevaFecha = e.target.value;
    if (!nuevaFecha) return emitir("", "");
    // Si todavía no eligió hora, o la que tenía ya pasó, se propone el primer horario libre.
    const esHoy = nuevaFecha === hoyStr;
    const ahora = new Date();
    const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const horaValida =
      hora && (permitirPasado || !esHoy || aMinutos(hora, 0) >= minAhora);
    if (horaValida) return emitir(nuevaFecha, hora);
    const ini = aMinutos(horaInicio, 8 * 60);
    const fin = aMinutos(horaFin, 20 * 60);
    let propuesta = ini;
    if (esHoy && !permitirPasado) {
      while (propuesta < minAhora && propuesta < fin) propuesta += paso;
    }
    emitir(nuevaFecha, propuesta < fin ? aHora(propuesta) : "");
  };

  const borde = invalido
    ? "border-amber-400 bg-amber-50/30 text-amber-900 focus:ring-amber-400/50"
    : "border-gray-300 focus:ring-[#2eb086]/50 focus:border-[#2eb086]";
  const base = `w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${borde} ${className}`;

  return (
    <div className="grid grid-cols-[1.4fr_1fr] gap-2">
      <input
        type="date"
        aria-label="Fecha"
        value={fecha}
        min={permitirPasado ? undefined : hoyStr}
        onChange={cambiarFecha}
        required={required}
        className={base}
      />
      <select
        aria-label="Hora"
        value={hora}
        onChange={(e) => emitir(fecha, e.target.value)}
        disabled={!fecha}
        required={required}
        className={`${base} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <option value="" disabled>
          {fecha ? "Hora" : "Elegí el día"}
        </option>
        {opciones.map((o) => (
          <option key={o.hora} value={o.hora} disabled={o.pasada}>
            {o.hora} hs
          </option>
        ))}
      </select>
    </div>
  );
}
