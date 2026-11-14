/** @format */

import { Clock, Stethoscope, Eye } from "lucide-react";
import { formatDateTime, formatDate } from "@/shared/utils";
import {
  obtenerColorAvatar,
  obtenerIniciales,
} from "@/shared/utils/avatarColors";
import TarjetaRegistro from "@/shared/components/ui/Tabla/TarjetaRegistro";
import { estadosMap } from "../utils/estadosMap";
import { BotonAcciones } from "./BotonAcciones";
import { BotonNotaTurno } from "./BotonNotaTurno";

export function calcularResumenCuentaTurno(turno) {
  const idEstado = Number(turno.id_estado || turno.EstadoTurno?.id_estado);
  const estadoNombre = turno.EstadoTurno?.estado || "Programado";
  const esAtendido = idEstado === 2 || estadoNombre === "Atendido";

  const sc = turno.SolicitudCobro || turno.Cobro;
  const montoTotal = Number(
    sc?.monto_total ?? sc?.monto_a_cobrar ?? turno.precio_final ?? 0,
  );
  const saldoPendiente =
    sc?.saldo_pendiente !== undefined
      ? Number(sc.saldo_pendiente)
      : esAtendido
        ? montoTotal
        : 0;
  const montoAbonado = Math.max(
    0,
    Number((montoTotal - saldoPendiente).toFixed(2)),
  );
  const estaSaldado = esAtendido && montoTotal > 0 && saldoPendiente <= 0;
  const esPagoParcial = esAtendido && montoAbonado > 0 && saldoPendiente > 0;
  const tieneDeuda = esAtendido && saldoPendiente > 0;

  return {
    idEstado,
    estadoNombre,
    esAtendido,
    montoTotal,
    saldoPendiente,
    montoAbonado,
    estaSaldado,
    esPagoParcial,
    tieneDeuda,
  };
}

export function renderTarjetaTurno({
  turno,
  recargar,
  abrirParaVer,
  abrirParaAtender,
  abrirParaReprogramar,
  abrirParaCancelar,
  abrirParaInasistente,
  abrirParaEditar,
  abrirParaEliminar,
  abrirModalPagoTurno,
  formatearTurnoParaReprogramar,
}) {
  const {
    estadoNombre,
    esAtendido,
    montoTotal,
    saldoPendiente,
    estaSaldado,
    esPagoParcial,
    tieneDeuda,
  } = calcularResumenCuentaTurno(turno);

  const configEstado = estadosMap[estadoNombre] || estadosMap.Programado;
  const IconoEstado = configEstado.icon;
  const paciente = turno.Paciente;
  const nombreCompleto = paciente
    ? `${paciente.nombre} ${paciente.apellido}`
    : `Paciente #${turno.id_paciente}`;

  const listaPracticas =
    turno.PracticaTurnos?.map((pt) => {
      const nombrePractica =
        pt.Practica?.nombre_referencia ||
        pt.Practica?.nombre_nomenclador ||
        "Práctica";
      const nombreObraSocial =
        pt.ObraSocial?.nombre ||
        pt.obra_social?.nombre ||
        turno.Paciente?.ObraSocial?.nombre ||
        turno.Paciente?.ObraSocials?.[0]?.nombre ||
        turno.Paciente?.PacienteObraSocials?.[0]?.ObraSocial?.nombre ||
        "Particular";
      return esAtendido
        ? `${nombrePractica} - ${nombreObraSocial}`
        : nombrePractica;
    }).join(", ") || "Sin especificar";

  return (
    <TarjetaRegistro
      key={turno.id_turno}
      onClick={() => abrirParaVer(turno)}
      titulo={nombreCompleto}
      subtitulo={`Turno #${turno.id_turno} · ${formatDateTime(turno.fecha_hora_inicio)}`}
      badge={
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${configEstado.color}`}
        >
          <IconoEstado size={11} />
          {configEstado.label || estadoNombre}
        </span>
      }
      campos={[
        {
          etiqueta: "Prácticas",
          valor: listaPracticas,
          completo: true,
        },
        {
          etiqueta: "Total Honorarios",
          valor: `$ ${montoTotal.toLocaleString("es-AR")}`,
        },
        {
          etiqueta: "Estado Cuenta",
          valor: !esAtendido
            ? "-"
            : estaSaldado
              ? "Saldado"
              : esPagoParcial
                ? `Resta $ ${saldoPendiente.toLocaleString("es-AR")}`
                : `Pendiente $ ${saldoPendiente.toLocaleString("es-AR")}`,
        },
      ]}
      acciones={
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => abrirParaVer(turno)}
            className="p-1.5 rounded-xl text-[#0d8266] dark:text-emerald-400 hover:text-[#09664f] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
            title="Ver detalle del turno"
          >
            <Eye size={17} />
          </button>
          <BotonAcciones
            turno={turno}
            abrirParaVer={abrirParaVer}
            abrirParaAtender={abrirParaAtender}
            abrirParaReprogramar={abrirParaReprogramar}
            abrirParaCancelar={abrirParaCancelar}
            abrirParaInasistente={abrirParaInasistente}
            abrirParaEditar={abrirParaEditar}
            abrirParaEliminar={abrirParaEliminar}
            abrirParaCobrar={abrirModalPagoTurno}
            formatearTurnoParaReprogramar={formatearTurnoParaReprogramar}
          />
        </div>
      }
    />
  );
}

export function renderFilaTurno({
  turno,
  recargar,
  abrirParaVer,
  abrirParaAtender,
  abrirParaReprogramar,
  abrirParaCancelar,
  abrirParaInasistente,
  abrirParaEditar,
  abrirParaEliminar,
  abrirModalPagoTurno,
  formatearTurnoParaReprogramar,
}) {
  const {
    estadoNombre,
    esAtendido,
    montoTotal,
    saldoPendiente,
    montoAbonado,
    estaSaldado,
    esPagoParcial,
    tieneDeuda,
  } = calcularResumenCuentaTurno(turno);

  const configEstado = estadosMap[estadoNombre] || estadosMap.Programado;
  const IconoEstado = configEstado.icon;
  const paciente = turno.Paciente;
  const nombreCompleto = paciente
    ? `${paciente.nombre} ${paciente.apellido}`
    : `Paciente #${turno.id_paciente}`;
  const avatarColor = obtenerColorAvatar(nombreCompleto);
  const iniciales = obtenerIniciales(paciente?.nombre, paciente?.apellido);
  const practicas = turno.PracticaTurnos || [];

  return (
    <tr
      key={turno.id_turno}
      onClick={() => abrirParaVer(turno)}
      className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
    >
      {/* 1. Paciente */}
      <td className="pl-6 sm:pl-7 pr-3 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-7 h-7 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0 ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border}`}
          >
            {iniciales}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate max-w-[170px]">
              {nombreCompleto}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              {paciente?.dni ? `DNI ${paciente.dni}` : "DNI S/D"}
            </span>
          </div>
        </div>
      </td>

      {/* 2. Práctica */}
      <td className="px-3 py-3">
        {practicas.length > 0 ? (
          <div className="flex flex-col gap-1 items-start">
            {practicas.map((pt, i) => {
              const nombrePractica =
                pt.Practica?.nombre_referencia ||
                pt.Practica?.nombre_nomenclador ||
                "Práctica";
              const nombreObraSocial =
                pt.ObraSocial?.nombre ||
                pt.obra_social?.nombre ||
                turno.Paciente?.ObraSocial?.nombre ||
                turno.Paciente?.ObraSocials?.[0]?.nombre ||
                turno.Paciente?.PacienteObraSocials?.[0]?.ObraSocial?.nombre ||
                "Particular";

              return (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 max-w-full"
                >
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] dark:text-emerald-300 border border-teal-200/80 dark:border-teal-800 px-2 py-0.5 rounded-lg max-w-[190px] truncate"
                    title={nombrePractica}
                  >
                    <Stethoscope size={11} className="shrink-0" />
                    <span className="truncate">{nombrePractica}</span>
                  </span>
                  {esAtendido && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                      - {nombreObraSocial}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">Sin asignar</span>
        )}
      </td>

      {/* 3. Fecha y Hora */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
            {formatDate(turno.fecha_hora_inicio)}
          </span>
          <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Clock size={11} className="text-[#0d8266] shrink-0" />
            <span>
              {new Date(turno.fecha_hora_inicio).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
              {turno.fecha_hora_fin &&
                ` - ${new Date(turno.fecha_hora_fin).toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })} hs`}
            </span>
          </div>
        </div>
      </td>

      {/* 4. Estado */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${configEstado.color}`}
        >
          <IconoEstado size={12} />
          {configEstado.label || estadoNombre}
        </span>
      </td>

      {/* 5. Honorarios */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
            $ {montoTotal.toLocaleString("es-AR")}
          </span>
          {esAtendido && montoTotal > 0 && (
            <span
              className={`text-[10px] font-bold ${
                estaSaldado
                  ? "text-emerald-600 dark:text-emerald-400"
                  : esPagoParcial
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {estaSaldado
                ? "✓ Turno pagado"
                : esPagoParcial
                  ? `Abonó $${montoAbonado.toLocaleString("es-AR")} · Resta $${saldoPendiente.toLocaleString("es-AR")}`
                  : `A cobrar ($${saldoPendiente.toLocaleString("es-AR")})`}
            </span>
          )}
        </div>
      </td>

      {/* 6. Notas */}
      <td
        className="px-3 py-3 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center">
          <BotonNotaTurno
            turno={turno}
            nota={turno.notas_consulta}
            onEditar={abrirParaEditar}
          />
        </div>
      </td>

      {/* 7. Acciones */}
      <td
        className="pl-3 pr-6 sm:pr-7 py-3 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => abrirParaVer(turno)}
            className="p-1.5 rounded-xl text-[#0d8266] dark:text-emerald-400 hover:text-[#09664f] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
            title="Ver detalle del turno"
          >
            <Eye size={17} />
          </button>

          <BotonAcciones
            turno={turno}
            abrirParaVer={abrirParaVer}
            abrirParaAtender={abrirParaAtender}
            abrirParaReprogramar={abrirParaReprogramar}
            abrirParaCancelar={abrirParaCancelar}
            abrirParaInasistente={abrirParaInasistente}
            abrirParaEditar={abrirParaEditar}
            abrirParaEliminar={abrirParaEliminar}
            abrirParaCobrar={abrirModalPagoTurno}
            formatearTurnoParaReprogramar={formatearTurnoParaReprogramar}
          />
        </div>
      </td>
    </tr>
  );
}

