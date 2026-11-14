/** @format */

import { useState, useEffect, useRef, useMemo } from "react";
import {
  obtenerColorAvatar,
  obtenerIniciales,
} from "@/shared/utils/avatarColors";
import turnosApi from "../services/turnos.api";

const FMT_DIA_SEMANA = new Intl.DateTimeFormat("es-AR", { weekday: "long" });
const FMT_MES = new Intl.DateTimeFormat("es-AR", { month: "long" });
const FMT_HORA = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
export const FMT_MONEDA = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
});

export function calcularDatosSubtituloFecha(inicio, fin, duracionMinutos) {
  if (!inicio) return null;
  const dInicio = new Date(inicio);
  if (isNaN(dInicio.getTime())) return null;

  const diaSemana = FMT_DIA_SEMANA.format(dInicio);
  const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  const dia = dInicio.getDate();
  const mes = FMT_MES.format(dInicio);
  const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1);
  const anio = dInicio.getFullYear();

  const horaInicio = FMT_HORA.format(dInicio);

  let horaFin = "";
  if (fin) {
    const dFin = new Date(fin);
    if (!isNaN(dFin.getTime())) {
      horaFin = FMT_HORA.format(dFin);
    }
  }

  const horas = horaFin ? `${horaInicio} a ${horaFin} hs` : `${horaInicio} hs`;
  return {
    textoFecha: `${diaSemanaCap}, ${dia} de ${mesCap} de ${anio}`,
    horas,
    duracionMinutos,
  };
}

export function useDetalleTurno({ isOpen, onClose, turno }) {
  const [practicasRemotas, setPracticasRemotas] = useState([]);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const tienePracticasIncrustadas = Array.isArray(turno?.PracticaTurnos);

  useEffect(() => {
    if (!isOpen || !turno || tienePracticasIncrustadas) return;

    let cancelado = false;
    if (turno.id_turno) {
      turnosApi
        .obtenerPracticasConDetalle(turno.id_turno)
        .then((res) => {
          if (!cancelado) {
            setPracticasRemotas(res.data.data || []);
          }
        })
        .catch(() => {
          if (!cancelado) {
            setPracticasRemotas([]);
          }
        });
    }
    return () => {
      cancelado = true;
    };
  }, [isOpen, turno, tienePracticasIncrustadas]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return useMemo(() => {
    if (!turno) return null;

    const paciente = turno.Paciente || {};
    const idEstado = Number(turno.id_estado || turno.EstadoTurno?.id_estado);
    const estadoNombre = turno.EstadoTurno?.estado || "Programado";

    const esProgramado = idEstado === 1 || estadoNombre === "Programado";
    const esAtendido = idEstado === 2 || estadoNombre === "Atendido";
    const esCancelado = idEstado === 3 || estadoNombre === "Cancelado";
    const esInasistente =
      idEstado === 4 ||
      estadoNombre === "Inasistente" ||
      estadoNombre === "Inasistido";
    const estaCanceladoOInasistido = esCancelado || esInasistente;

    const listaPracticas = tienePracticasIncrustadas
      ? turno.PracticaTurnos
      : practicasRemotas;

    const primerTratamiento =
      listaPracticas.length > 0 ? listaPracticas[0] : null;

    const nombreTratamiento =
      primerTratamiento?.Practica?.nombre_referencia ||
      primerTratamiento?.Practica?.nombre_nomenclador ||
      "Consulta General / Diagnóstico";

    const codigoNomenclador =
      primerTratamiento?.Practica?.codigo ||
      primerTratamiento?.Practica?.codigo_nomenclador ||
      "01.01";

    const nombreObraSocial =
      listaPracticas.find((p) => p?.ObraSocial?.nombre)?.ObraSocial?.nombre ||
      primerTratamiento?.ObraSocial?.nombre ||
      turno.ObraSocial?.nombre ||
      turno.Paciente?.ObraSocial?.nombre ||
      turno.Paciente?.ObraSocials?.[0]?.nombre ||
      turno.Paciente?.PacienteObraSocials?.[0]?.ObraSocial?.nombre ||
      "Particular";

    let duracionMinutos = 30;
    if (turno.fecha_hora_inicio && turno.fecha_hora_fin) {
      const diff =
        (new Date(turno.fecha_hora_fin) - new Date(turno.fecha_hora_inicio)) /
        60000;
      if (diff > 0) duracionMinutos = Math.round(diff);
    } else if (turno.duracion_minutos) {
      duracionMinutos = turno.duracion_minutos;
    }

    const solicitudCobro = turno.SolicitudCobro || turno.Cobro;
    const estaAbonado = Boolean(
      solicitudCobro &&
        (solicitudCobro.estado === "saldado" ||
          (Number(
            solicitudCobro.monto_total ?? solicitudCobro.monto_a_cobrar,
          ) > 0 &&
            Number(solicitudCobro.saldo_pendiente) === 0)),
    );

    const coloresAvatar = obtenerColorAvatar(
      `${paciente.nombre || ""} ${paciente.apellido || ""}`,
    );
    const iniciales = obtenerIniciales(paciente.nombre, paciente.apellido);

    const telLimpio = paciente.telefono
      ? String(paciente.telefono).replace(/\D/g, "")
      : "";

    const infoFecha = calcularDatosSubtituloFecha(
      turno.fecha_hora_inicio,
      turno.fecha_hora_fin,
      duracionMinutos,
    );

    const estilosCardEstado = esProgramado
      ? {
          card: "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/90 dark:border-amber-800/60",
          label: "text-amber-700/80 dark:text-amber-400",
          dot: "bg-amber-500",
          title: "text-amber-950 dark:text-amber-200",
          desc: "text-amber-800/80 dark:text-amber-300/80",
        }
      : esAtendido
        ? {
            card: "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/90 dark:border-emerald-800/60",
            label: "text-emerald-700/80 dark:text-emerald-400",
            dot: "bg-emerald-500",
            title: "text-emerald-950 dark:text-emerald-200",
            desc: "text-emerald-800/80 dark:text-emerald-300/80",
          }
        : esCancelado
          ? {
              card: "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/90 dark:border-rose-800/60",
              label: "text-rose-700/80 dark:text-rose-400",
              dot: "bg-rose-500",
              title: "text-rose-950 dark:text-rose-200",
              desc: "text-rose-800/80 dark:text-rose-300/80",
            }
          : {
              card: "bg-slate-100/90 dark:bg-slate-800/70 border-slate-300/90 dark:border-slate-700",
              label: "text-slate-500 dark:text-slate-400",
              dot: "bg-slate-500",
              title: "text-slate-900 dark:text-slate-100",
              desc: "text-slate-600 dark:text-slate-400",
            };

    return {
      paciente,
      estadoNombre,
      esProgramado,
      esAtendido,
      esCancelado,
      estaCanceladoOInasistido,
      listaPracticas,
      nombreTratamiento,
      codigoNomenclador,
      nombreObraSocial,
      duracionMinutos,
      estaAbonado,
      coloresAvatar,
      iniciales,
      telLimpio,
      infoFecha,
      tituloModal: "Detalle del turno",
      estilosCardEstado,
      precioFormateado: FMT_MONEDA.format(Number(turno.precio_final || 0)),
    };
  }, [turno, tienePracticasIncrustadas, practicasRemotas]);
}

