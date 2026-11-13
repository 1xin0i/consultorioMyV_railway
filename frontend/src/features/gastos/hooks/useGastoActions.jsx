/** @format */

import { useCrudActions } from "@/shared/hooks/useCrudActions";

export function useGastoActions(recargar, cerrarModal) {
  const { guardar, eliminar, cargandoAccion } = useCrudActions({
    endpoint: "/gastos",
    idKey: "id_gasto",
    recargar,
    cerrarModal,
    metodoEliminar: "patch_delete",
    validar: (datosFormulario) => {
      if (!datosFormulario.id_categoria) {
        return "Debes seleccionar una categoría de gasto.";
      }
      if (!datosFormulario.monto || Number(datosFormulario.monto) <= 0) {
        return "El monto del gasto debe ser mayor a 0.";
      }
      if (!datosFormulario.fecha_gasto) {
        return "La fecha del gasto es obligatoria.";
      }
      return null;
    },
    formatearPayload: (datosFormulario) => ({
      id_categoria: Number(datosFormulario.id_categoria),
      monto: parseFloat(datosFormulario.monto),
      fecha_gasto: datosFormulario.fecha_gasto,
      detalle: datosFormulario.detalle?.trim() || null,
    }),
    mensajes: {
      creado: "Gasto registrado correctamente",
      actualizado: "Gasto actualizado correctamente",
      eliminado: "Gasto eliminado correctamente",
      errorGuardar: "No se pudo guardar el gasto.",
      errorEliminar: "No se pudo eliminar el gasto.",
    },
  });

  return {
    guardarGasto: guardar,
    ejecutarEliminacion: eliminar,
    cargandoAccion,
  };
}
