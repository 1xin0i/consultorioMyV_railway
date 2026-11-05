/** @format */
import { useState, useCallback } from "react";

/**
 * Hook agnóstico para gestionar el ciclo de vida de modales de formularios CRUD
 * (creación, edición, activación/toggle y eliminación).
 *
 * @param {Object} estadoInicialFormulario - Valores por defecto del formulario.
 */
export function useCRUDModal(estadoInicialFormulario) {
  // * DEFINICION DE ESTADOS GENERALES
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalToggle, setModalToggle] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState(estadoInicialFormulario);

  // * ABRIR MODAL DE CREAR
  const abrirParaCrear = useCallback(
    (datosExtra = {}) => {
      setEditando(false);
      setItemSeleccionado(null);
      setDatosFormulario({ ...estadoInicialFormulario, ...datosExtra });
      setModalAbierto(true);
    },
    [estadoInicialFormulario],
  );

  // * ABRIR MODAL DE EDITAR
  const abrirParaEditar = useCallback((item, formateadorDatos = (i) => i) => {
    setEditando(true);
    setItemSeleccionado(item);
    setDatosFormulario(formateadorDatos(item));
    setModalAbierto(true);
  }, []);

  // * ABRIR MODAL DE TOGGLE
  const abrirParaToggle = useCallback((item) => {
    setItemSeleccionado(item);
    setModalToggle(true);
  }, []);

  // * ABRIR MODAL DE ELIMINAR
  const abrirParaEliminar = useCallback((item) => {
    setItemSeleccionado(item);
    setModalEliminar(true);
  }, []);

  // * CERRAR MODALES (RESETEA A VALORES POR DEFECTO)
  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setModalEliminar(false);
    setModalToggle(false);
    setItemSeleccionado(null);
    setDatosFormulario(estadoInicialFormulario);
  }, [estadoInicialFormulario]);

  // * ACTUALIZAR DATOS DEL FORMULARIO
  const actualizarDatos = useCallback((e) => {
    if (typeof e === "function") {
      setDatosFormulario(e);
    } else if (e?.target) {
      const { name, value } = e.target;
      setDatosFormulario((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  return {
    modalAbierto,
    modalToggle,
    modalEliminar,
    editando,
    itemSeleccionado,
    datosFormulario,
    setDatosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaToggle,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos,
  };
}
