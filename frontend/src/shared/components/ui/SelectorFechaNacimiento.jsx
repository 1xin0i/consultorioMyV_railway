/** @format */

import { useEffect, useState } from "react";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const dosDigitos = (n) => String(n).padStart(2, "0");

const separar = (valor) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor || ""));
  return m
    ? { anio: m[1], mes: String(Number(m[2])), dia: String(Number(m[3])) }
    : { anio: "", mes: "", dia: "" };
};

const unir = ({ anio, mes, dia }) =>
  anio && mes && dia ? `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}` : "";

const diasDelMes = (anio, mes) =>
  mes ? new Date(Number(anio) || 2000, Number(mes), 0).getDate() : 31;

/**
 * Fecha de nacimiento en tres listas (día, mes y año), para no tener que
 * navegar el calendario mes por mes hasta el año de nacimiento.
 * Devuelve "AAAA-MM-DD" (o "" mientras está incompleta) con un evento { target: { name, value } }.
 */
export default function SelectorFechaNacimiento({
  name,
  value,
  onChange,
  className = "",
  edadMinima = 1,
  edadMaxima = 110,
}) {
  const [partes, setPartes] = useState(() => separar(value));

  // Si el formulario cambia el valor desde afuera (al editar otro paciente o al limpiarlo), se sincroniza.
  useEffect(() => {
    setPartes((actuales) =>
      unir(actuales) === (value || "") ? actuales : separar(value),
    );
  }, [value]);

  const actualizar = (campo, valor) => {
    const siguientes = { ...partes, [campo]: valor };
    // Si el día no existe en el mes elegido (ej. 31 de febrero), se ajusta al último día.
    const maxDia = diasDelMes(siguientes.anio, siguientes.mes);
    if (Number(siguientes.dia) > maxDia) siguientes.dia = String(maxDia);
    setPartes(siguientes);
    onChange?.({ target: { name, value: unir(siguientes) } });
  };

  const anioActual = new Date().getFullYear();
  const anios = [];
  for (let a = anioActual - edadMinima; a >= anioActual - edadMaxima; a--) {
    anios.push(a);
  }
  const cantidadDias = diasDelMes(partes.anio, partes.mes);

  const base = `cursor-pointer ${className}`;

  return (
    <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
      <select
        aria-label="Día de nacimiento"
        value={partes.dia}
        onChange={(e) => actualizar("dia", e.target.value)}
        className={base}
      >
        <option value="">Día</option>
        {Array.from({ length: cantidadDias }, (_, i) => i + 1).map((d) => (
          <option key={d} value={String(d)}>
            {d}
          </option>
        ))}
      </select>
      <select
        aria-label="Mes de nacimiento"
        value={partes.mes}
        onChange={(e) => actualizar("mes", e.target.value)}
        className={base}
      >
        <option value="">Mes</option>
        {MESES.map((m, i) => (
          <option key={m} value={String(i + 1)}>
            {m}
          </option>
        ))}
      </select>
      <select
        aria-label="Año de nacimiento"
        value={partes.anio}
        onChange={(e) => actualizar("anio", e.target.value)}
        className={base}
      >
        <option value="">Año</option>
        {anios.map((a) => (
          <option key={a} value={String(a)}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}
