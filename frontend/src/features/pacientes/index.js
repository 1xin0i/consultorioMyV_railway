/** @format */

export { GestionPacientes } from "./pages/GestionPacientes";
export {
  FormularioCrearEditar,
  FormularioCrearEditar as FormularioPaciente,
  FormularioEliminar,
} from "./components/FormulariosPaciente";
export { VistaPaciente } from "./components/VistaPaciente";
export { ModalCrearPaciente } from "./components/ModalCrearPaciente";
export { BotonAccionesPaciente } from "./components/BotonAccionesPaciente";
export { usePacienteActions } from "./hooks/usePacienteActions";
export { useObrasSocialesCatalogo } from "./hooks/useObrasSocialesCatalogo";
export { formatearPacienteParaEditar } from "./utils/formatearPacienteParaEditar";
export { calcularEdad } from "./utils/calcularEdad";
export { pacientesApi } from "./services/pacientes.api";

