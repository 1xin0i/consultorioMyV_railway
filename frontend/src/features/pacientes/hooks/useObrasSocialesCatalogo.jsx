/** @format */

import { useState, useEffect } from "react";
import { obrasSocialesApi } from "@/features/obrasSociales";

export function useObrasSocialesCatalogo() {
  const [obrasSocialesCatalogo, setObrasSocialesCatalogo] = useState([]);

  useEffect(() => {
    const fetchObrasSociales = async () => {
      try {
        const respuesta = await obrasSocialesApi.listar({ limit: 1000 });
        setObrasSocialesCatalogo(respuesta.data.data || []);
      } catch (error) {
        console.error("Error al cargar el catálogo de obras sociales:", error);
      }
    };
    fetchObrasSociales();
  }, []);

  return { obrasSocialesCatalogo };
}
