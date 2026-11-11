/** @format */
import { useCrudActions } from "../../../hooks/useCrudActions";

export function useObraSocialActions(recargar, cerrarModal) {
  const { guardar, toggle, eliminar, cargandoAccion } = useCrudActions({
    endpoint: "/obras-sociales",
    idKey: "id_obra_social",
    recargar,
    cerrarModal,
    mensajes: {
      actualizado: "Obra Social actualizada correctamente",
      registrado: "Obra Social registrada correctamente",
      toggle: "Estado de la obra social actualizada",
      eliminado: "Obra Social eliminada correctamente",
      errorGuardar: "No se pudo guardar la obra social.",
      errorToggle: "No se pudo actualizar el estado la obra social.",
      errorEliminar: "No se pudo eliminar la obra social.",
    },
  });

  const guardarObraSocial = (
    datosFormulario,
    editando,
    obraSocialSeleccionada,
  ) =>
    guardar(
      {
        nombre: datosFormulario.nombre.trim(),
        codigo_prestador: datosFormulario.codigo_prestador
          ? datosFormulario.codigo_prestador.trim()
          : null,
      },
      editando,
      obraSocialSeleccionada,
    );

  return {
    guardarObraSocial,
    toggleObraSocial: toggle,
    eliminarObraSocial: eliminar,
    cargandoAccion,
  };
}
