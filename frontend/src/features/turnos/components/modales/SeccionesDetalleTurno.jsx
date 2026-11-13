/** @format */

import { Phone, MessageCircle, Stethoscope, Clock } from "lucide-react";
import { FMT_MONEDA } from "../../hooks/useDetalleTurno";

export function SubtituloFechaTurno({ infoFecha }) {
  if (!infoFecha) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
      <span className="font-semibold text-slate-800 dark:text-slate-100">
        {infoFecha.textoFecha}
      </span>
      <span className="text-slate-300 dark:text-slate-600 font-bold">·</span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] dark:text-emerald-300 border border-teal-200/90 dark:border-teal-800/70 shadow-2xs">
        <Clock
          size={13}
          className="shrink-0 text-[#0d8266] dark:text-emerald-400"
        />
        <span>{infoFecha.horas}</span>
      </span>
      {infoFecha.duracionMinutos ? (
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          ({infoFecha.duracionMinutos} min)
        </span>
      ) : null}
    </div>
  );
}

export function TarjetaPacienteTurno({
  paciente,
  coloresAvatar,
  iniciales,
  telLimpio,
}) {
  return (
    <div className="rounded-2xl bg-teal-100/50 dark:bg-teal-950/30 p-3.5 sm:p-4 flex items-center justify-between gap-3 border border-teal-200/80 dark:border-teal-800/60 shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-11 h-11 rounded-full ${coloresAvatar.bg} ${coloresAvatar.text} border ${coloresAvatar.border} flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs`}
        >
          {iniciales}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight truncate">
              {paciente.nombre} {paciente.apellido}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                paciente.activo !== false
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300"
              }`}
            >
              {paciente.activo !== false ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
            DNI {paciente.dni || "S/D"} · Tel:{" "}
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              {paciente.telefono || "S/D"}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {paciente.telefono ? (
          <>
            <a
              href={`https://wa.me/${telLimpio}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-2.5 sm:py-2 rounded-full sm:rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="Contactar por WhatsApp"
            >
              <MessageCircle size={16} />
            </a>
            <a
              href={`tel:${paciente.telefono}`}
              className="p-2 sm:px-2.5 sm:py-2 rounded-full sm:rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="Llamar al paciente"
            >
              <Phone size={16} />
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function GridEstadoHonorariosTurno({
  estilosCardEstado,
  estadoNombre,
  esProgramado,
  esAtendido,
  esCancelado,
  estaCanceladoOInasistido,
  estaAbonado,
  precioFormateado,
  nombreObraSocial,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        className={`rounded-2xl p-3.5 sm:p-4 border flex flex-col justify-between ${estilosCardEstado.card}`}
      >
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${estilosCardEstado.label}`}
        >
          ESTADO ACTUAL
        </span>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${estilosCardEstado.dot}`}
          />
          <span
            className={`font-bold text-sm sm:text-base ${estilosCardEstado.title}`}
          >
            {estadoNombre}
          </span>
        </div>
        <p
          className={`text-[11px] font-medium mt-1 ${estilosCardEstado.desc}`}
        >
          {esProgramado
            ? "Turno programado"
            : esAtendido
              ? "Turno completado y atendido"
              : esCancelado
                ? "Turno cancelado"
                : "El paciente no asistió"}
        </p>
      </div>

      <div className="rounded-2xl p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            HONORARIOS
          </span>
          {estaCanceladoOInasistido ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 bg-white dark:bg-slate-800">
              Sin cargo
            </span>
          ) : estaAbonado ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40">
              Abonado
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40">
              A Cobrar
            </span>
          )}
        </div>

        <div className="mt-1">
          <span className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-lg tabular-nums">
            ${precioFormateado}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
          Cobertura:{" "}
          <span className="text-slate-700 dark:text-slate-300 font-semibold">
            {nombreObraSocial}
          </span>
        </p>
      </div>
    </div>
  );
}

export function ListaTratamientosTurno({
  listaPracticas,
  duracionMinutos,
  nombreTratamiento,
  codigoNomenclador,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {listaPracticas && listaPracticas.length > 1
            ? `Tratamientos Planificados (${listaPracticas.length})`
            : "Tratamiento Planificado"}
        </h3>
        {listaPracticas && listaPracticas.length > 1 && (
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Duración total: {duracionMinutos} min
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {listaPracticas && listaPracticas.length > 0 ? (
          listaPracticas.map((pt, idx) => {
            const practica = pt.Practica || pt;
            const nombre =
              practica.nombre_referencia ||
              practica.nombre_nomenclador ||
              "Consulta General / Diagnóstico";
            const codigo =
              practica.codigo_nomenclador || practica.codigo || "";
            const especialidad = practica.especialidad;
            const precioRef = Number(practica.precio_referencia);

            return (
              <div
                key={
                  pt.id_practica_turno ||
                  pt.id ||
                  `${practica.id_practica || idx}-${idx}`
                }
                className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 sm:p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] border border-[#0d8266]/30 flex items-center justify-center shrink-0">
                    <Stethoscope size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                      {nombre}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {codigo ? <span>Nomenclador: {codigo}</span> : null}
                      {especialidad ? (
                        <>
                          <span>·</span>
                          <span>{especialidad}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {listaPracticas.length === 1 ? (
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-2xs">
                    {duracionMinutos} min
                  </span>
                ) : precioRef > 0 ? (
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-2xs">
                    ${FMT_MONEDA.format(precioRef)}
                  </span>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] border border-[#0d8266]/30 flex items-center justify-center shrink-0">
                <Stethoscope size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                  {nombreTratamiento}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Nomenclador: {codigoNomenclador}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-2xs">
              {duracionMinutos} min
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

