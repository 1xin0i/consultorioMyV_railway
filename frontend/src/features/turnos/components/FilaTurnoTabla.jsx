/** @format */

import { Clock, Stethoscope, Banknote } from "lucide-react";
import { formatDateTime } from "@/shared/utils";
import {
  obtenerColorAvatar,
  obtenerIniciales,
} from "@/shared/utils/avatarColors";
import TarjetaRegistro from "@/shared/components/ui/Tabla/TarjetaRegistro";
import { estadosMap } from "../utils/estadosMap";
import { BotonAcciones } from "./BotonAcciones";
import { AdvertenciaPacienteIncompleto } from "./AdvertenciaPacienteIncompleto";
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
    turno.PracticaTurnos?.map(
      (pt) =>
        pt.Practica?.nombre_referencia ||
        pt.Practica?.nombre_nomenclador ||
        "Práctica",
    ).join(", ") || "Sin especificar";

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
        <div className="flex items-center gap-1">
          {tieneDeuda && (
            <button
              type="button"
              onClick={() => abrirModalPagoTurno(turno)}
              className="px-2 py-1 rounded-lg bg-[#0d8266] hover:bg-[#09664f] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Registrar Pago"
            >
              <Banknote size={13} />
              <span>Cobrar</span>
            </button>
          )}
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
      className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
    >
      <td className="px-3 py-3 text-teal-800/70 dark:text-emerald-400 font-mono text-xs font-bold whitespace-nowrap">
        #{turno.id_turno}
      </td>

      <td className="px-3 py-3 whitespace-nowrap">
        <div className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-xs">
          <Clock size={13} className="text-[#0d8266] shrink-0" />
          <span>{formatDateTime(turno.fecha_hora_inicio)}</span>
        </div>
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0 ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border}`}
          >
            {iniciales}
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate max-w-[160px]">
              {nombreCompleto}
            </span>
            <AdvertenciaPacienteIncompleto
              paciente={paciente}
              alActualizarPaciente={recargar}
            />
          </div>
        </div>
      </td>

      <td className="px-3 py-3">
        {practicas.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {practicas.slice(0, 2).map((pt, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] dark:text-emerald-300 border border-teal-200/80 dark:border-teal-800 px-2 py-0.5 rounded-lg truncate max-w-[190px]"
              >
                <Stethoscope size={11} className="shrink-0" />
                <span className="truncate">
                  {pt.Practica?.nombre_referencia ||
                    pt.Practica?.nombre_nomenclador ||
                    "Práctica"}
                </span>
              </span>
            ))}
            {practicas.length > 2 && (
              <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded-md">
                +{practicas.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">Sin asignar</span>
        )}
      </td>

      <td className="px-3 py-3 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${configEstado.color}`}
        >
          <IconoEstado size={12} />
          {configEstado.label || estadoNombre}
        </span>
      </td>

      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
            $ {montoTotal.toLocaleString("es-AR")}
          </span>
          {esAtendido && montoTotal > 0 && (
            <span
              className={`text-[10px] font-bold ${
                estaSaldado
                  ? "text-emerald-600"
                  : esPagoParcial
                    ? "text-amber-700"
                    : "text-rose-600"
              }`}
            >
              {estaSaldado
                ? "✓ Saldado"
                : esPagoParcial
                  ? `Abonó $${montoAbonado.toLocaleString("es-AR")} · Resta $${saldoPendiente.toLocaleString("es-AR")}`
                  : `Pendiente $${saldoPendiente.toLocaleString("es-AR")}`}
            </span>
          )}
        </div>
      </td>

      <td
        className="px-3 py-3 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center">
          <BotonNotaTurno nota={turno.notas_consulta} />
        </div>
      </td>

      <td
        className="px-3 py-3 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-1">
          {tieneDeuda && (
            <button
              type="button"
              onClick={() => abrirModalPagoTurno(turno)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0d8266] hover:bg-[#09664f] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Registrar Pago del Turno"
            >
              <Banknote size={13} />
              <span>Cobrar</span>
            </button>
          )}
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

