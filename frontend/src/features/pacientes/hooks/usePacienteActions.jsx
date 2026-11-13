/** @format */

import { useState } from "react";
import toast from "react-hot-toast";
import { manejarErrorApi } from "@/shared/utils/errorHandler";
import pacientesApi from "../services/pacientes.api";

export function usePacienteActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarPaciente = async (
    datosFormulario,
    editando,
    pacienteSeleccionado,
    idsParaEliminar = [],
    limpiarIdsEliminar = () => {},
  ) => {
    if (!datosFormulario.nombre?.trim() || !datosFormulario.apellido?.trim()) {
      toast.error("El nombre y el apellido son obligatorios.");
      return;
    }

    setCargandoAccion(true);
    try {
      const payloadPaciente = {
        nombre: datosFormulario.nombre.trim(),
        apellido: datosFormulario.apellido.trim(),
        dni: datosFormulario.dni?.trim() || null,
        telefono: datosFormulario.telefono?.trim() || null,
        fecha_nacimiento: datosFormulario.fecha_nacimiento || null,
        domicilio: datosFormulario.domicilio?.trim() || null,
        activo:
          datosFormulario.activo !== undefined ? datosFormulario.activo : true,
      };

      let idPacienteActual;

      if (editando) {
        idPacienteActual =
          pacienteSeleccionado?.id_paciente || datosFormulario.id_paciente;
        await pacientesApi.actualizar(idPacienteActual, payloadPaciente);
      } else {
        const res = await pacientesApi.crear(payloadPaciente);
        const creado = res.data.data || res.data;
        idPacienteActual = creado.id_paciente;
      }

      if (editando && idsParaEliminar.length > 0) {
        for (const idRelacion of idsParaEliminar) {
          await pacientesApi.eliminarRelacionObraSocial(idRelacion);
        }
        limpiarIdsEliminar();
      }

      const listaOS = datosFormulario.obras_sociales || [];
      for (const os of listaOS) {
        if (!os.id_obra_social) continue;

        if (os.id_relacion) {
          await pacientesApi.actualizarRelacionObraSocial(os.id_relacion, {
            id_paciente: Number(idPacienteActual),
            id_obra_social: Number(os.id_obra_social),
            nro_afiliado: os.nro_afiliado?.trim() || "S/N",
          });
        } else {
          await pacientesApi.crearRelacionObraSocial({
            id_paciente: Number(idPacienteActual),
            id_obra_social: Number(os.id_obra_social),
            nro_afiliado: os.nro_afiliado?.trim() || "S/N",
          });
        }
      }

      toast.success(
        editando
          ? "Paciente actualizado correctamente"
          : "Paciente registrado correctamente",
      );
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar paciente:", error);
      manejarErrorApi(error, "No se pudo guardar el paciente.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const cambiarEstadoPaciente = async (pacienteSeleccionado) => {
    if (!pacienteSeleccionado) return;
    try {
      await pacientesApi.cambiarEstado(pacienteSeleccionado.id_paciente);
      toast.success(
        pacienteSeleccionado.activo === false
          ? "Paciente reactivado correctamente"
          : "Paciente dado de baja correctamente",
      );
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al cambiar estado del paciente:", error);
      manejarErrorApi(error, "No se pudo cambiar el estado del paciente.");
    }
  };

  return {
    guardarPaciente,
    cambiarEstadoPaciente,
    cargandoAccion,
  };
}
