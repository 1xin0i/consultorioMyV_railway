/** @format */

import { useCrudActions } from "@/shared/hooks/useCrudActions";

export function useObraSocialActions(recargar, cerrarModal) {
  const { guardar, eliminar, cargandoAccion } = useCrudActions({
    endpoint: "/obras-sociales",
    idKey: "id_obra_social",
    recargar,
    cerrarModal,
    metodoEliminar: "put_toggle",
    validar: (datosFormulario) => {
      if (!datosFormulario.nombre?.trim()) {
        return "El nombre de la obra social es obligatorio.";
      }
      return null;
    },
    formatearPayload: (datosFormulario) => ({
      nombre: datosFormulario.nombre.trim(),
      activo:
        datosFormulario.activo !== undefined ? datosFormulario.activo : true,
    }),
    mensajes: {
      creado: "Obra social registrada correctamente",
      actualizado: "Obra social actualizada correctamente",
      eliminado: "Estado actualizado correctamente",
      errorGuardar: "No se pudo guardar la obra social.",
      errorEliminar: "No se pudo cambiar el estado de la obra social.",
    },
  });

  const cambiarEstadoObraSocial = (obraSocialSeleccionada) => {
    if (!obraSocialSeleccionada) return;
    return eliminar(obraSocialSeleccionada, {
      activo: !obraSocialSeleccionada.activo,
    });
  };

  return {
    guardarObraSocial: guardar,
    cambiarEstadoObraSocial,
    cargandoAccion,
  };
}
