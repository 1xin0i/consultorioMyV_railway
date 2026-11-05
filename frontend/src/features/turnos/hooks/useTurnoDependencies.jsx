/** @format */
import { useState, useEffect } from "react";
import api from "../../../services/api";

export function useTurnoDependencies() {
  const [pacientes, setPacientes] = useState([]);
  const [practicasLista, setPracticasLista] = useState([]);
  const [obrasSocialesPaciente, setObrasSocialesPaciente] = useState([]);

  const fetchCatalogos = async () => {
    try {
      const [resPacientes, resPracticas] = await Promise.all([
        api.get("/pacientes", { params: { limit: 1000 } }),
        api.get("/practicas", { params: { limit: 1000 } }),
      ]);
      setPacientes(resPacientes.data.data || []);
      setPracticasLista(resPracticas.data.data || []);
    } catch (error) {
      console.error("Error al cargar dependencias de turnos:", error);
    }
  };

  const fetchObrasSocialesPaciente = async (id_paciente) => {
    if (!id_paciente) return;
    try {
      const respuesta = await api.get(`/pacientes-por-obras-sociales/${id_paciente}`);
      setObrasSocialesPaciente(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar las obras sociales del paciente:", error);
    }
  };

  useEffect(() => {
    fetchCatalogos();
  }, []);

  return {
    pacientes,
    setPacientes,
    practicasLista,
    obrasSocialesPaciente,
    buscarOSPaciente: fetchObrasSocialesPaciente,
    recargarCatalogos: fetchCatalogos,
  };
}
