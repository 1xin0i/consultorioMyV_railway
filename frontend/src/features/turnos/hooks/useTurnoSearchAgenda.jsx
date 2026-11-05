/** @format */
import { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";

export function useTurnoSearchAgenda(endpoint) {
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [practicasLista, setPracticasLista] = useState([]);
  const [obrasSocialesPaciente, setObrasSocialesPaciente] = useState([]);
  const [cargando, setCargando] = useState(false);

  const fetchTurnos = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await api.get(endpoint);
      setTurnos(respuesta.data.data || []);
    } catch (error) {
      console.error(`Error al cargar datos de ${endpoint}:`, error);
    } finally {
      setCargando(false);
    }
  }, [endpoint]);

  const fetchCatalogos = useCallback(async () => {
    try {
      const [resPacientes, resPracticas] = await Promise.all([
        api.get("/pacientes", { params: { limit: 1000 } }),
        api.get("/practicas", { params: { limit: 1000 } }),
      ]);
      setPacientes(resPacientes.data.data || []);
      setPracticasLista(resPracticas.data.data || []);
    } catch (error) {
      console.error("Error al cargar dependencias de agenda:", error);
    }
  }, []);

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
    fetchTurnos();
    fetchCatalogos();
  }, [fetchTurnos, fetchCatalogos]);

  return {
    turnos,
    pacientes,
    setPacientes,
    practicasLista,
    obrasSocialesPaciente,
    cargando,
    recargar: fetchTurnos,
    buscarOSPaciente: fetchObrasSocialesPaciente,
  };
}
