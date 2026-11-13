/** @format */

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import httpClient from "@/shared/services/httpClient";
import { manejarErrorApi } from "@/shared/utils/errorHandler";

/**
 * Hook genérico para operaciones CRUD simples (Crear, Actualizar, Eliminar/Toggle)
 */
export function useCrudActions({
  endpoint,
  recargar,
  cerrarModal,
  idKey,
  formatearPayload,
  validar,
  mensajes = {},
  metodoEliminar = "patch_delete",
}) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const {
    creado = "Registro creado correctamente",
    actualizado = "Registro actualizado correctamente",
    eliminado = "Estado actualizado correctamente",
    errorGuardar = "No se pudo guardar los cambios.",
    errorEliminar = "No se pudo actualizar el estado.",
  } = mensajes;

  const guardar = useCallback(
    async (datosFormulario, editando, itemSeleccionado) => {
      if (validar) {
        const errorValidacion = validar(datosFormulario, editando);
        if (errorValidacion) {
          toast.error(errorValidacion);
          return false;
        }
      }

      setCargandoAccion(true);
      try {
        const payload = formatearPayload
          ? formatearPayload(datosFormulario, editando)
          : datosFormulario;

        if (editando) {
          const id = itemSeleccionado?.[idKey] ?? datosFormulario?.[idKey];
          await httpClient.put(`${endpoint}/${id}`, payload);
        } else {
          await httpClient.post(endpoint, payload);
        }

        toast.success(editando ? actualizado : creado);
        if (recargar) recargar();
        if (cerrarModal) cerrarModal();
        return true;
      } catch (error) {
        console.error(`Error al guardar en ${endpoint}:`, error);
        manejarErrorApi(error, errorGuardar);
        return false;
      } finally {
        setCargandoAccion(false);
      }
    },
    [
      endpoint,
      idKey,
      formatearPayload,
      validar,
      actualizado,
      creado,
      errorGuardar,
      recargar,
      cerrarModal,
    ],
  );

  const eliminar = useCallback(
    async (itemSeleccionado, payloadExtra) => {
      if (!itemSeleccionado) return false;
      const id =
        typeof itemSeleccionado === "object"
          ? itemSeleccionado[idKey]
          : itemSeleccionado;

      setCargandoAccion(true);
      try {
        if (metodoEliminar === "delete") {
          await httpClient.delete(`${endpoint}/${id}`);
        } else if (metodoEliminar === "put_toggle") {
          await httpClient.put(`${endpoint}/${id}`, payloadExtra);
        } else {
          await httpClient.patch(`${endpoint}/${id}/delete`);
        }

        toast.success(eliminado);
        if (recargar) recargar();
        if (cerrarModal) cerrarModal();
        return true;
      } catch (error) {
        console.error(`Error al eliminar/cambiar estado en ${endpoint}:`, error);
        manejarErrorApi(error, errorEliminar);
        return false;
      } finally {
        setCargandoAccion(false);
      }
    },
    [endpoint, idKey, metodoEliminar, eliminado, errorEliminar, recargar, cerrarModal],
  );

  return {
    guardar,
    eliminar,
    cargandoAccion,
  };
}

