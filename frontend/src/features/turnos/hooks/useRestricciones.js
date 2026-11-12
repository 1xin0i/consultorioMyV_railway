/** @format */

import { useConfiguracion } from "../../../context/ConfiguracionContext";

/**
 * Hook para gestionar las restricciones / bloqueos de agenda
 * sincronizados con MySQL a través de ConfiguracionContext.
 */
export const useRestricciones = () => {
  const {
    restricciones,
    agregarRestriccion,
    eliminarRestriccion,
    esDiaBloqueado,
    obtenerRestriccionDia,
    esSlotBloqueado,
    obtenerRestriccionSlot,
    obtenerRestriccionesDeFecha,
  } = useConfiguracion();

  return {
    restricciones,
    agregarRestriccion,
    eliminarRestriccion,
    esDiaBloqueado,
    obtenerRestriccionDia,
    esSlotBloqueado,
    obtenerRestriccionSlot,
    obtenerRestriccionesDeFecha,
  };
};

export default useRestricciones;
