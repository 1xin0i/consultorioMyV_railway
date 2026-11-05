/** @format */
import { useCrudActions } from "../../../hooks/useCrudActions";

export function useGastoActions(recargar, cerrarModal) {
  const { guardar, toggle, eliminar, cargandoAccion } = useCrudActions({
    endpoint: "/gastos",
    idKey: "id_gasto",
    recargar,
    cerrarModal,
    mensajes: {
      actualizado: "Gasto actualizado correctamente",
      registrado: "Gasto registrado correctamente",
      toggle: "Estado del gasto actualizado",
      eliminado: "Gasto eliminado definitivamente",
      errorGuardar: "No se pudo guardar el gasto.",
      errorToggle: "No se pudo actualizar el estado del gasto.",
      errorEliminar: "No se pudo eliminar el gasto.",
    },
  });

  const guardarGasto = (datosFormulario, editando, gastoSeleccionado) =>
    guardar(
      {
        id_categoria_gasto: Number(datosFormulario.id_categoria_gasto),
        monto: parseFloat(datosFormulario.monto),
        concepto: datosFormulario.concepto.trim(),
        fecha_gasto: datosFormulario.fecha_gasto || new Date().toISOString(),
        metodo_pago: datosFormulario.metodo_pago || "Efectivo",
        comprobante: datosFormulario.comprobante
          ? datosFormulario.comprobante.trim()
          : null,
        notas: datosFormulario.notas ? datosFormulario.notas.trim() : null,
      },
      editando,
      gastoSeleccionado,
    );

  return {
    guardarGasto,
    toggleGasto: toggle,
    eliminarGasto: eliminar,
    cargandoAccion,
  };
}
