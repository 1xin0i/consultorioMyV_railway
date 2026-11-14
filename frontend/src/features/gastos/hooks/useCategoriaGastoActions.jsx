/** @format */

import { useCrudActions } from "@/shared/hooks/useCrudActions";

export function useCategoriaGastoActions(recargar, cerrarModal) {
  const { guardar, eliminar, cargandoAccion } = useCrudActions({
    endpoint: "/categorias-gastos",
    idKey: "id_categoria_gasto",
    recargar,
    cerrarModal,
    metodoEliminar: "patch_delete",
    validar: (datosFormulario) => {
      if (!datosFormulario.nombre?.trim()) {
        return "El nombre de la categoría es obligatorio.";
      }
      if (datosFormulario.nombre.trim().length < 2) {
        return "El nombre debe tener al menos 2 caracteres.";
      }
      return null;
    },
    formatearPayload: (datosFormulario) => ({
      nombre: datosFormulario.nombre.trim(),
      descripcion: datosFormulario.descripcion?.trim() || null,
    }),
    mensajes: {
      creado: "Categoría de egreso registrada correctamente",
      actualizado: "Categoría de egreso actualizada correctamente",
      eliminado: "Estado de la categoría actualizado correctamente",
      errorGuardar: "No se pudo guardar la categoría de egreso.",
      errorEliminar: "No se pudo actualizar el estado de la categoría.",
    },
  });

  return {
    guardarCategoria: guardar,
    cambiarEstadoCategoria: eliminar,
    cargandoAccion,
  };
}

