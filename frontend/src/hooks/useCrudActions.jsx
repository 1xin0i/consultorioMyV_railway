/** @format */
import { useState, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../utils/errorHandler";

/**
 * Acciones CRUD genéricas (guardar / activar-desactivar / eliminar) contra un endpoint REST.
 * Centraliza el manejo de loading, toasts y errores que antes se repetía en cada feature.
 *
 * @param {Object} config
 * @param {string} config.endpoint - Ruta base, ej: "/practicas"
 * @param {string} config.idKey - Nombre de la PK del registro, ej: "id_practica"
 * @param {Function} config.recargar - Recarga el listado luego de una acción exitosa
 * @param {Function} config.cerrarModal - Cierra el modal luego de una acción exitosa
 * @param {Object} config.mensajes - Textos de toasts / errores
 */
export function useCrudActions({ endpoint, idKey, recargar, cerrarModal, mensajes }) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const finalizar = useCallback(
    (mensajeExito) => {
      toast.success(mensajeExito);
      recargar();
      cerrarModal();
    },
    [recargar, cerrarModal],
  );

  const guardar = async (payload, editando, itemSeleccionado) => {
    setCargandoAccion(true);
    try {
      if (editando) {
        await api.put(`${endpoint}/${itemSeleccionado[idKey]}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      finalizar(editando ? mensajes.actualizado : mensajes.registrado);
    } catch (error) {
      console.error(mensajes.errorGuardar, error);
      manejarErrorApi(error, mensajes.errorGuardar);
    } finally {
      setCargandoAccion(false);
    }
  };

  const toggle = async (itemSeleccionado) => {
    if (!itemSeleccionado) return;
    try {
      await api.patch(`${endpoint}/${itemSeleccionado[idKey]}/delete`);
      finalizar(mensajes.toggle);
    } catch (error) {
      console.error(mensajes.errorToggle, error);
      manejarErrorApi(error, mensajes.errorToggle);
    }
  };

  const eliminar = async (itemSeleccionado) => {
    if (!itemSeleccionado) return;
    try {
      await api.delete(`${endpoint}/${itemSeleccionado[idKey]}/delete`);
      finalizar(mensajes.eliminado);
    } catch (error) {
      console.error(mensajes.errorEliminar, error);
      manejarErrorApi(error, mensajes.errorEliminar);
    }
  };

  return { guardar, toggle, eliminar, cargandoAccion };
}

