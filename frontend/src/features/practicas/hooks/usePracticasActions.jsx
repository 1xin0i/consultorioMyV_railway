/** @format */

import { useCrudActions } from "@/shared/hooks/useCrudActions";

export function usePracticasActions(recargar, cerrarModal) {
  const { guardar, eliminar, cargandoAccion } = useCrudActions({
    endpoint: "/practicas",
    idKey: "id_practica",
    recargar,
    cerrarModal,
    metodoEliminar: "patch_delete",
    validar: (datosFormulario) => {
      if (
        !datosFormulario.codigo_nomenclador?.trim() ||
        !datosFormulario.nombre_nomenclador?.trim() ||
        !datosFormulario.nombre_referencia?.trim() ||
        !datosFormulario.especialidad?.trim()
      ) {
        return "Todos los campos obligatorios deben estar completos.";
      }
      return null;
    },
    formatearPayload: (datosFormulario) => ({
      codigo_nomenclador: datosFormulario.codigo_nomenclador.trim(),
      nombre_nomenclador: datosFormulario.nombre_nomenclador.trim(),
      nombre_referencia: datosFormulario.nombre_referencia.trim(),
      especialidad: datosFormulario.especialidad.trim(),
      precio_referencia: parseFloat(datosFormulario.precio_referencia || 0),
      activo:
        datosFormulario.activo !== undefined ? datosFormulario.activo : true,
    }),
    mensajes: {
      creado: "Práctica registrada correctamente",
      actualizado: "Práctica actualizada correctamente",
      eliminado: "Estado de la práctica actualizado correctamente",
      errorGuardar: "No se pudo guardar la práctica.",
      errorEliminar: "No se pudo actualizar el estado de la práctica.",
    },
  });

  return {
    guardarPractica: guardar,
    cambiarEstadoPractica: eliminar,
    cargandoAccion,
  };
}
