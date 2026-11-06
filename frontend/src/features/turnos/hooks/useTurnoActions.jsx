import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";
import { formatDateTimeInput } from "../../../utils";
import { formatearTurnoParaReprogramar } from "../utils/formatTurnoParaReprogramar";
import { useConfiguracion } from "../../../context/ConfiguracionContext";

export function useTurnoActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);
  const { validarTurnoHorario, esDiaLaboral } = useConfiguracion();

  const guardarTurno = async (datosFormulario, editando, turnoSeleccionadoCRUD) => {
    if (!datosFormulario?.id_paciente) {
      toast.error("Por favor, selecciona un paciente para el turno.");
      return;
    }
    if (!datosFormulario?.fecha_hora_inicio) {
      toast.error("Por favor, selecciona la fecha y hora de inicio del turno.");
      return;
    }

    // Validar jornada y día laboral al registrar nuevo turno
    if (!editando && validarTurnoHorario) {
      const validacion = validarTurnoHorario(datosFormulario.fecha_hora_inicio);
      if (!validacion.valido) {
        toast.error(validacion.mensaje, { id: "error-horario-invalido" });
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
        };

        await api.put(`/turnos/${turnoSeleccionadoCRUD.id_turno}`, payload);
      } else {
        // Al crear, sí requerimos las fechas y la duración completa
        const duracionMin = Number(datosFormulario.duracion_minutos) || 30;
        const fechaInicioDate = new Date(datosFormulario.fecha_hora_inicio);
        const fechaFinDate =
          datosFormulario.fecha_hora_fin && !isNaN(new Date(datosFormulario.fecha_hora_fin).getTime())
            ? new Date(datosFormulario.fecha_hora_fin)
            : new Date(fechaInicioDate.getTime() + duracionMin * 60000);

        payload = {
          id_paciente: Number(datosFormulario.id_paciente),
          precio_final: parseFloat(datosFormulario.precio_final || 0),
          fecha_hora_inicio: fechaInicioDate.toISOString(),
          fecha_hora_fin: fechaFinDate.toISOString(),
          notas_consulta: datosFormulario.notas_consulta?.trim() || undefined,
        };

        await api.post("/turnos", payload);
      }

      toast.success(editando ? "Turno actualizado correctamente" : "Turno registrado correctamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el turno:", error);
      manejarErrorApi(error, "No se pudo guardar el turno.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const procesarAtencionTurno = async (datosAtencion, turnoSeleccionado, cerrarModalAtender) => {
    if (!turnoSeleccionado) return;
    try {
      const payloadAtencion = {
        notas_consulta: datosAtencion.notas_consulta?.trim() || undefined,
        precio_final: parseFloat(datosAtencion.precio_final),
        practicas_realizadas: datosAtencion.practicas
          .filter((p) => p.id_practica)
          .map((p) => Number(p.id_practica)),
        obras_sociales: datosAtencion.practicas
          .filter((p) => p.id_practica)
          .map((p) => (p.id_obra_social ? Number(p.id_obra_social) : null)),
      };

      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/atender`, payloadAtencion);

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
      const payloadAtencion = { notas_consulta: datosCancelacion.notas_consulta.trim() };
      if (inasistente) {
        await api.patch(`/turnos/${turnoSeleccionadoCancelar.id_turno}/inasistente`, payloadAtencion);
      } else {
        await api.patch(`/turnos/${turnoSeleccionadoCancelar.id_turno}/cancelar`, payloadAtencion);
      }

      toast.success(
        inasistente ? "Turno marcado como inasistido correctamente" : "Turno cancelado correctamente",
      );
      recargar();
      cerrarModalCancelar();
    } catch (error) {
      console.error("Error al registrar la cancelación:", error);
      manejarErrorApi(
        error,
        inasistente ? "No se pudo marcar como inasistido" : "No se pudo cancelar el turno.",
      );
    }
  };

  const procesarReprogramacionTurno = async (
    datosReprogramacion,
    turnoSeleccionado,
    cerrarModalReprogramar,
  ) => {
    if (!turnoSeleccionado) return;

    if (validarTurnoHorario) {
      const validacion = validarTurnoHorario(datosReprogramacion.fecha_hora_inicio);
      if (!validacion.valido) {
        toast.error(validacion.mensaje, { id: "error-horario-invalido" });
        return;
      }
    }

    try {
      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/reprogramado`, {
        fecha_hora_inicio: new Date(datosReprogramacion.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(datosReprogramacion.fecha_hora_fin).toISOString(),
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
      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/delete`);

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
      if (esDiaLaboral && !esDiaLaboral(selectInfo.startStr)) {
        toast.error("No se pueden agendar turnos en días no laborales.", {
          id: "error-dia-no-laboral",
        });
        return;
      }

      if (validarTurnoHorario) {
        const validacion = validarTurnoHorario(selectInfo.startStr);
        if (!validacion.valido) {
          toast.error(validacion.mensaje, { id: "error-horario-invalido" });
          return;
        }
      }

      const nuevaFechaInicio = formatDateTimeInput(selectInfo.startStr);

      // Calculamos la duración y la fecha fin según los bloques/celdas seleccionadas
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

      // Si había un turno esperando ser reprogramado:
      if (turnoReprogramando) {
        const turnoConNuevaFecha = {
          ...turnoReprogramando,
          fecha_hora_inicio: nuevaFechaInicio,
          duracion_minutos: duracionMinutos,
          fecha_hora_fin: nuevaFechaFin,
        };

        // Abrimos el modal de reprogramar con la nueva fecha y duración calculada
        abrirParaReprogramar(turnoConNuevaFecha, formatearTurnoParaReprogramar);

        // Limpiamos el estado y el toast
        setTurnoReprogramando(null);
        toast.dismiss();
        return;
      }

      // Si no había ningún turno para reprogramar, abrimos el modal de creación con los datos iniciales
      abrirParaCrear({
        fecha_hora_inicio: nuevaFechaInicio,
        duracion_minutos: duracionMinutos,
        fecha_hora_fin: nuevaFechaFin,
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
