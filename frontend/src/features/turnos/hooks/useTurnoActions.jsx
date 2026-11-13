/** @format */

import { useState } from "react";
import toast from "react-hot-toast";
import { manejarErrorApi } from "@/shared/utils/errorHandler";
import { formatDateTimeInput } from "@/shared/utils";
import { formatearTurnoParaReprogramar } from "../utils/formatTurnoParaReprogramar";
import { useConfiguracion } from "@/features/configuracion";
import turnosApi from "../services/turnos.api";

export function useTurnoActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);
  const { validarTurnoHorario } = useConfiguracion();

  const guardarTurno = async (
    datosFormulario,
    editando,
    turnoSeleccionadoCRUD,
  ) => {
    if (!datosFormulario?.id_paciente) {
      toast.error("Por favor, selecciona un paciente para el turno.");
      return;
    }
    if (!datosFormulario?.fecha_hora_inicio) {
      toast.error("Por favor, selecciona la fecha y hora de inicio del turno.");
      return;
    }

    const ignorarRestr = Boolean(datosFormulario.ignorarRestricciones);

    if (!editando && validarTurnoHorario && !ignorarRestr) {
      const validacion = validarTurnoHorario(
        datosFormulario.fecha_hora_inicio,
        datosFormulario.duracion_minutos,
      );
      if (!validacion.valido) {
        toast.error(
          `${validacion.mensaje} Confirmá la excepción de urgencia para agendarlo.`,
          { id: "error-horario-invalido" },
        );
        return;
      }
    }

    setCargandoAccion(true);
    try {
      let payload;

      if (editando) {
        payload = {
          id_paciente: Number(datosFormulario.id_paciente),
          id_estado: Number(datosFormulario.id_estado || 1),
          precio_final: parseFloat(datosFormulario.precio_final || 0),
          notas_consulta: datosFormulario.notas_consulta?.trim() || undefined,
          practicas: Array.isArray(datosFormulario.practicas)
            ? datosFormulario.practicas
                .map((p) =>
                  typeof p === "object" ? Number(p.id_practica) : Number(p),
                )
                .filter(Boolean)
            : undefined,
        };

        await turnosApi.actualizar(turnoSeleccionadoCRUD.id_turno, payload);
      } else {
        const duracionMin = Number(datosFormulario.duracion_minutos) || 30;
        const fechaInicioDate = new Date(datosFormulario.fecha_hora_inicio);
        const fechaFinDate =
          datosFormulario.fecha_hora_fin &&
          !isNaN(new Date(datosFormulario.fecha_hora_fin).getTime())
            ? new Date(datosFormulario.fecha_hora_fin)
            : new Date(fechaInicioDate.getTime() + duracionMin * 60000);

        payload = {
          id_paciente: Number(datosFormulario.id_paciente),
          precio_final: parseFloat(datosFormulario.precio_final || 0),
          fecha_hora_inicio: fechaInicioDate.toISOString(),
          fecha_hora_fin: fechaFinDate.toISOString(),
          notas_consulta: datosFormulario.notas_consulta?.trim() || undefined,
          ignorarRestricciones: ignorarRestr,
          practicas: Array.isArray(datosFormulario.practicas)
            ? datosFormulario.practicas
                .map((p) =>
                  typeof p === "object" ? Number(p.id_practica) : Number(p),
                )
                .filter(Boolean)
            : [],
        };

        await turnosApi.crear(payload);
      }

      toast.success(
        editando
          ? "Turno actualizado correctamente"
          : "Turno registrado correctamente",
      );
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el turno:", error);
      manejarErrorApi(error, "No se pudo guardar el turno.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const procesarAtencionTurno = async (
    datosAtencion,
    turnoSeleccionado,
    cerrarModalAtender,
  ) => {
    if (!turnoSeleccionado) return;
    try {
      const practicasValidas = (datosAtencion.practicas || []).filter(
        (p) => p && p.id_practica,
      );

      const payloadAtencion = {
        notas_consulta: datosAtencion.notas_consulta?.trim() || undefined,
        precio_final: parseFloat(datosAtencion.precio_final || 0),
        practicas: practicasValidas.map((p) => ({
          id_practica: Number(p.id_practica),
          id_obra_social: p.id_obra_social ? Number(p.id_obra_social) : null,
        })),
        practicas_realizadas: practicasValidas.map((p) =>
          Number(p.id_practica),
        ),
        obras_sociales: practicasValidas.map((p) =>
          p.id_obra_social ? Number(p.id_obra_social) : null,
        ),
      };

      await turnosApi.atender(turnoSeleccionado.id_turno, payloadAtencion);

      toast.success("Turno atendido correctamente");
      recargar();
      cerrarModalAtender();
    } catch (error) {
      console.error("Error al registrar la atención del turno:", error);
      manejarErrorApi(error, "No se pudo atender el turno.");
    }
  };

  const procesarCancelacionTurno = async (
    inasistente,
    turnoSeleccionadoCancelar,
    datosCancelacion,
    cerrarModalCancelar,
  ) => {
    if (!turnoSeleccionadoCancelar) return;
    try {
      const payloadAtencion = {
        notas_consulta: datosCancelacion.notas_consulta.trim(),
      };
      if (inasistente) {
        await turnosApi.marcarInasistente(
          turnoSeleccionadoCancelar.id_turno,
          payloadAtencion,
        );
      } else {
        await turnosApi.cancelar(
          turnoSeleccionadoCancelar.id_turno,
          payloadAtencion,
        );
      }

      toast.success(
        inasistente
          ? "Turno marcado como inasistido correctamente"
          : "Turno cancelado correctamente",
      );
      recargar();
      cerrarModalCancelar();
    } catch (error) {
      console.error("Error al registrar la cancelación:", error);
      manejarErrorApi(
        error,
        inasistente
          ? "No se pudo marcar como inasistido"
          : "No se pudo cancelar el turno.",
      );
    }
  };

  const procesarReprogramacionTurno = async (
    datosReprogramacion,
    turnoSeleccionado,
    cerrarModalReprogramar,
  ) => {
    if (!turnoSeleccionado) return;

    const ignorarRestr = Boolean(datosReprogramacion.ignorarRestricciones);

    if (validarTurnoHorario && !ignorarRestr) {
      const validacion = validarTurnoHorario(
        datosReprogramacion.fecha_hora_inicio,
        datosReprogramacion.duracion_minutos,
      );
      if (!validacion.valido) {
        toast.error(
          `${validacion.mensaje} Confirmá la excepción de urgencia para reprogramarlo.`,
          { id: "error-horario-invalido" },
        );
        return;
      }
    }

    try {
      await turnosApi.reprogramar(turnoSeleccionado.id_turno, {
        fecha_hora_inicio: new Date(
          datosReprogramacion.fecha_hora_inicio,
        ).toISOString(),
        fecha_hora_fin: new Date(
          datosReprogramacion.fecha_hora_fin,
        ).toISOString(),
        ignorarRestricciones: ignorarRestr,
      });

      toast.success("Turno reprogramado correctamente");
      recargar();
      cerrarModalReprogramar();
    } catch (error) {
      console.error("Error al reprogramar el turno:", error);
      manejarErrorApi(error, "No se pudo reprogramar el turno.");
    }
  };

  const ejecutarEliminacion = async (turnoSeleccionado) => {
    if (!turnoSeleccionado) return;
    try {
      await turnosApi.eliminar(turnoSeleccionado.id_turno);

      toast.success("Turno eliminado correctamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al eliminar turno:", error);
      manejarErrorApi(error, "No se pudo eliminar el turno.");
    }
  };

  const manejarSeleccionFechaCalendario = (
    selectInfo,
    abrirParaCrear,
    abrirParaReprogramar,
    actualizarDatos,
    turnoReprogramando,
    setTurnoReprogramando,
  ) => {
    if (selectInfo && selectInfo.startStr) {
      const nuevaFechaInicio = formatDateTimeInput(selectInfo.startStr);

      let duracionMinutos = 30;
      let nuevaFechaFin;

      if (selectInfo.endStr) {
        const fechaInicioObj = new Date(selectInfo.startStr);
        const fechaFinObj = new Date(selectInfo.endStr);
        const diferenciaMs = fechaFinObj - fechaInicioObj;
        duracionMinutos = Math.max(15, Math.round(diferenciaMs / (1000 * 60)));
        nuevaFechaFin = formatDateTimeInput(selectInfo.endStr);
      } else {
        const fechaFinObj = new Date(
          new Date(selectInfo.startStr).getTime() + duracionMinutos * 60000,
        );
        nuevaFechaFin = formatDateTimeInput(fechaFinObj);
      }

      if (turnoReprogramando) {
        const turnoConNuevaFecha = {
          ...turnoReprogramando,
          fecha_hora_inicio: nuevaFechaInicio,
          duracion_minutos: duracionMinutos,
          fecha_hora_fin: nuevaFechaFin,
          ignorarRestricciones: false,
        };

        abrirParaReprogramar(turnoConNuevaFecha, formatearTurnoParaReprogramar);

        setTurnoReprogramando(null);
        toast.dismiss();
        return;
      }

      abrirParaCrear({
        fecha_hora_inicio: nuevaFechaInicio,
        duracion_minutos: duracionMinutos,
        fecha_hora_fin: nuevaFechaFin,
        ignorarRestricciones: false,
      });
    }
  };

  const procesarClickEnTurno = (clickInfo, abrirParaEditar, abrirParaVer) => {
    const turnoEncontrado = clickInfo.event._def.extendedProps;
    if (!turnoEncontrado) return;

    abrirParaVer(turnoEncontrado);
  };

  return {
    guardarTurno,
    procesarAtencionTurno,
    procesarCancelacionTurno,
    procesarReprogramacionTurno,
    ejecutarEliminacion,
    manejarSeleccionFechaCalendario,
    procesarClickEnTurno,
    cargandoAccion,
  };
}
