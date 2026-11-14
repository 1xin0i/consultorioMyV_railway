/** @format */

import { useState } from "react";
import toast from "react-hot-toast";
import { manejarErrorApi } from "@/shared/utils/errorHandler";
import cobrosApi from "../services/cobros.api";

export function useCobroActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarCobro = async (datosFormulario, editando, cobroSeleccionado) => {
    const esInformal = datosFormulario.tipo_ingreso === "informal";

    if (!esInformal && !datosFormulario.id_turno) {
      toast.error("Debes seleccionar un turno atendido para registrar el cobro.");
      return;
    }

    if (esInformal && !datosFormulario.concepto_informal?.trim()) {
      toast.error("El concepto del ingreso es obligatorio.");
      return;
    }

    if (!datosFormulario.monto_pagado || Number(datosFormulario.monto_pagado) <= 0) {
      toast.error("El monto del cobro debe ser mayor a 0.");
      return;
    }

    if (!datosFormulario.medio_pago) {
      toast.error("Selecciona un medio de pago.");
      return;
    }

    setCargandoAccion(true);
    try {
      if (editando) {
        const idTarget =
          cobroSeleccionado?.id_cobro ||
          cobroSeleccionado?.id_movimiento ||
          datosFormulario.id_cobro;

        await cobrosApi.actualizar(idTarget, {
          monto_pagado: parseFloat(datosFormulario.monto_pagado),
          medio_pago: datosFormulario.medio_pago,
          fecha_cobro: datosFormulario.fecha_cobro,
          observaciones: esInformal
            ? `[Ingreso Informal] ${datosFormulario.concepto_informal.trim()}${
                datosFormulario.observaciones?.trim()
                  ? ` - ${datosFormulario.observaciones.trim()}`
                  : ""
              }`
            : datosFormulario.observaciones?.trim() || null,
        });

        toast.success("Cobro actualizado correctamente");
      } else if (esInformal) {
        await cobrosApi.crearCobroInformal({
          concepto: datosFormulario.concepto_informal.trim(),
          monto_pagado: parseFloat(datosFormulario.monto_pagado),
          medio_pago: datosFormulario.medio_pago,
          fecha_cobro: datosFormulario.fecha_cobro,
          observaciones: datosFormulario.observaciones?.trim() || null,
        });

        toast.success("Ingreso registrado correctamente");
      } else {
        await cobrosApi.crearCobroInmediato({
          id_turno: Number(datosFormulario.id_turno),
          monto_pagado: parseFloat(datosFormulario.monto_pagado),
          medio_pago: datosFormulario.medio_pago,
          fecha_cobro: datosFormulario.fecha_cobro,
          observaciones: datosFormulario.observaciones?.trim() || null,
        });

        toast.success("Cobro registrado correctamente");
      }

      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar cobro:", error);
      manejarErrorApi(error, "No se pudo guardar el cobro.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const ejecutarEliminacionCobro = async (cobroSeleccionado) => {
    if (!cobroSeleccionado) return;
    try {
      const idTarget =
        cobroSeleccionado.id_cobro || cobroSeleccionado.id_movimiento;
      await cobrosApi.eliminar(idTarget);
      toast.success("Cobro anulado correctamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al anular cobro:", error);
      manejarErrorApi(error, "No se pudo anular el cobro.");
    }
  };

  return {
    guardarCobro,
    ejecutarEliminacionCobro,
    cargandoAccion,
  };
}
