/** @format */

import { useState, useEffect } from "react";
import { pacientesApi } from "@/features/pacientes";
import { practicasApi } from "@/features/practicas";

export function useTurnoDependencies() {
  const [pacientes, setPacientes] = useState([]);
  const [practicasLista, setPracticasLista] = useState([]);
  const [obrasSocialesPaciente, setObrasSocialesPaciente] = useState([]);

  const fetchCatalogos = async () => {
    try {
      const [resPacientes, resPracticas] = await Promise.all([
        pacientesApi.listar({ limit: 1000 }),
        practicasApi.listar({ limit: 1000 }),
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
      const respuesta =
        await pacientesApi.listarObrasSocialesDePaciente(id_paciente);
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
