/** @format */

import { useState, useEffect, useCallback } from "react";
import gastosApi from "../services/gastos.api";

export function useCategoriasGastosCatalogo() {
  const [categorias, setCategorias] = useState([]);

  const fetchCategorias = useCallback(async () => {
    try {
      const respuesta = await gastosApi.listarCategorias({ limit: 1000 });
      setCategorias(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar categorías de gastos:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  return { categorias, setCategorias, recargarCategorias: fetchCategorias };
}
