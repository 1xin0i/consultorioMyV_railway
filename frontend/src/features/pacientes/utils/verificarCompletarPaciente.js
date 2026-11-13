/** @format */

import pacientesApi from "../services/pacientes.api";

export const verificarCompletarPaciente = async (
  searchParams,
  setSearchParams,
  abrirParaEditar,
  formatearPacienteParaEditar,
) => {
  const editarId = searchParams.get("editar");
  if (!editarId) return;

  try {
    const respuesta = await pacientesApi.obtenerPorId(editarId);
    const pacienteEncontrado = respuesta.data.data || respuesta.data;
    if (pacienteEncontrado) {
      abrirParaEditar(pacienteEncontrado, formatearPacienteParaEditar);
    }
  } catch (error) {
    console.error("Error al buscar el paciente para completar ficha:", error);
  } finally {
    searchParams.delete("editar");
    setSearchParams(searchParams, { replace: true });
  }
};
