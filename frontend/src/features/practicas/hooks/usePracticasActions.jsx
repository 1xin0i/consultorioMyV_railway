/** @format */
import { useCrudActions } from "../../../hooks/useCrudActions";

export function usePracticaActions(recargar, cerrarModal) {
  const { guardar, toggle, eliminar, cargandoAccion } = useCrudActions({
    endpoint: "/practicas",
    idKey: "id_practica",
    recargar,
    cerrarModal,
    mensajes: {
      actualizado: "Practica actualizada correctamente",
      registrado: "Practica registrada correctamente",
      toggle: "Estado de la practica actualizada",
      eliminado: "Práctica eliminada correctamente",
      errorGuardar: "No se pudo guardar la practica.",
      errorToggle: "No se pudo actualizar el estado de la práctica.",
      errorEliminar: "No se pudo eliminar la práctica.",
    },
  });

  const guardarPractica = (datosFormulario, editando, practicaSeleccionada) =>
    guardar(
      {
        codigo_nomenclador: datosFormulario.codigo_nomenclador.trim(),
        nombre_nomenclador: datosFormulario.nombre_nomenclador.trim(),
        nombre_referencia: datosFormulario.nombre_referencia.trim(),
        especialidad: datosFormulario.especialidad.trim(),
        precio_referencia: parseFloat(datosFormulario.precio_referencia),
      },
      editando,
      practicaSeleccionada,
    );

  return {
    guardarPractica,
    togglePractica: toggle,
    eliminarPractica: eliminar,
    cargandoAccion,
  };
}
