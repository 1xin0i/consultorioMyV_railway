/** @format */

import { useState, useCallback } from "react";

export function useCRUDModal(estadoInicialFormulario = {}) {
  const [modalCrearEditar, setModalCrearEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [modalCobro, setModalCobro] = useState(false);
  const [modalAtender, setModalAtender] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [modalInasistente, setModalInasistente] = useState(false);
  const [modalReprogramar, setModalReprogramar] = useState(false);

  const [editando, setEditando] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);

  const [datosFormulario, setDatosFormulario] = useState(
    estadoInicialFormulario,
  );

  const abrirParaCrear = useCallback(
    (datosPredefinidos = {}) => {
      setEditando(false);
      setItemSeleccionado(null);
      const inicialesSeguros =
        datosPredefinidos &&
        typeof datosPredefinidos === "object" &&
        !datosPredefinidos.nativeEvent
          ? datosPredefinidos
          : {};

      setDatosFormulario({ ...estadoInicialFormulario, ...inicialesSeguros });
      setModalCrearEditar(true);
    },
    [estadoInicialFormulario],
  );

  const abrirParaEditar = useCallback(
    (item, formatearDatos) => {
      setEditando(true);
      setItemSeleccionado(item);
      if (formatearDatos) {
        setDatosFormulario(formatearDatos(item));
      } else {
        setDatosFormulario({ ...estadoInicialFormulario, ...item });
      }
      setModalCrearEditar(true);
    },
    [estadoInicialFormulario],
  );

  const abrirParaEliminar = useCallback((item) => {
    setItemSeleccionado(item);
    setModalEliminar(true);
  }, []);

  const abrirParaVer = useCallback((item) => {
    setItemSeleccionado(item);
    setModalVer(true);
  }, []);

  const abrirParaCobrar = useCallback(
    (item, formatearDatos) => {
      setItemSeleccionado(item);
      if (formatearDatos) {
        setDatosFormulario(formatearDatos(item));
      } else {
        setDatosFormulario({ ...estadoInicialFormulario, ...item });
      }
      setModalVer(false);
      setModalCobro(true);
    },
    [estadoInicialFormulario],
  );

  const abrirParaAtender = useCallback(
    (item, formatearDatos) => {
      setItemSeleccionado(item);
      if (formatearDatos) {
        setDatosFormulario(formatearDatos(item));
      } else {
        setDatosFormulario({ ...estadoInicialFormulario, ...item });
      }
      setModalVer(false);
      setModalAtender(true);
    },
    [estadoInicialFormulario],
  );

  const abrirParaCancelar = useCallback(
    (item, formatearDatos) => {
      setItemSeleccionado(item);
      if (formatearDatos) {
        setDatosFormulario(formatearDatos(item));
      } else {
        setDatosFormulario({ ...estadoInicialFormulario, ...item });
      }
      setModalVer(false);
      setModalCancelar(true);
    },
    [estadoInicialFormulario],
  );

  const abrirParaInasistente = useCallback(
    (item, formatearDatos) => {
      setItemSeleccionado(item);
      if (formatearDatos) {
        setDatosFormulario(formatearDatos(item));
      } else {
        setDatosFormulario({ ...estadoInicialFormulario, ...item });
      }
      setModalVer(false);
      setModalInasistente(true);
    },
    [estadoInicialFormulario],
  );

  const abrirParaReprogramar = useCallback(
    (item, formatearDatos) => {
      setItemSeleccionado(item);
      if (formatearDatos) {
        setDatosFormulario(formatearDatos(item));
      } else {
        setDatosFormulario({ ...estadoInicialFormulario, ...item });
      }
      setModalVer(false);
      setModalReprogramar(true);
    },
    [estadoInicialFormulario],
  );

  const cerrarModal = useCallback(() => {
    setModalCrearEditar(false);
    setModalEliminar(false);
    setModalVer(false);
    setModalCobro(false);
    setModalAtender(false);
    setModalCancelar(false);
    setModalInasistente(false);
    setModalReprogramar(false);
    setItemSeleccionado(null);
    setEditando(false);
    setDatosFormulario(estadoInicialFormulario);
  }, [estadoInicialFormulario]);

  const actualizarDatos = useCallback((eventoOValor) => {
    if (eventoOValor && eventoOValor.target) {
      const { name, value } = eventoOValor.target;
      setDatosFormulario((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (typeof eventoOValor === "function") {
      setDatosFormulario((prev) => eventoOValor(prev));
    } else if (typeof eventoOValor === "object" && eventoOValor !== null) {
      setDatosFormulario((prev) => ({
        ...prev,
        ...eventoOValor,
      }));
    }
  }, []);

  return {
    modalCrearEditar,
    modalEliminar,
    modalVer,
    modalCobro,
    modalAtender,
    modalCancelar,
    modalInasistente,
    modalReprogramar,
    editando,
    itemSeleccionado,
    datosFormulario,

    abrirParaCrear,
    abrirParaEditar,
    abrirParaEliminar,
    abrirParaVer,
    abrirParaCobrar,
    abrirParaAtender,
    abrirParaCancelar,
    abrirParaInasistente,
    abrirParaReprogramar,
    cerrarModal,
    actualizarDatos,
    setDatosFormulario,
  };
}

