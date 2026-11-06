import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";

export function useCobroActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarCobro = async (datosFormulario, editando, cobroSeleccionado) => {
    if (!datosFormulario?.id_turno) {
      toast.error("Por favor seleccioná un turno para cobrar.");
      return;
    }

    const monto = Number(datosFormulario?.monto_a_cobrar);
    if (!monto || monto <= 0) {
      toast.error("El monto a cobrar debe ser mayor a 0.");
      return;
    }

    setCargandoAccion(true);
    try {
      const payloadBase = {
        id_turno: Number(datosFormulario.id_turno),
        id_paciente: Number(datosFormulario.id_paciente),
        monto_a_cobrar: monto,
      };

      if (editando) {
        await api.put(`/cobros/${cobroSeleccionado.id_cobro}`, {
          ...payloadBase,
          cant_cuotas: 1,
        });
        toast.success("Cobro actualizado correctamente");
      } else {
        const modalidad =
          datosFormulario.modalidad === "informal" ? "informal" : "inmediato";

        if (modalidad === "informal") {
          await api.post("/cobros/informal", {
            ...payloadBase,
            entrega_inicial: Number(datosFormulario.entrega_inicial) || 0,
            metodo_pago: datosFormulario.metodo_pago || "Efectivo",
          });
        } else if (modalidad === "cuotas") {
          await api.post("/cobros/cuotas", {
            ...payloadBase,
            cant_cuotas: Number(datosFormulario.cant_cuotas) || 3,
            fecha_primer_vencimiento:
              datosFormulario.fecha_primer_vencimiento ||
              new Date().toISOString().split("T")[0],
          });
        } else {
          // Por defecto y para "inmediato": Al Contado
          await api.post("/cobros/inmediato", {
            ...payloadBase,
            metodo_pago: datosFormulario.metodo_pago || "Efectivo",
          });
        }
        toast.success("Cobro registrado correctamente");
      }

      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar el cobro:", error);
      manejarErrorApi(error, "No se pudo procesar el cobro.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const ejecutarEliminacion = async (cobroSeleccionado, cerrarModalEliminar) => {
    if (!cobroSeleccionado) return;
    setCargandoAccion(true);
    try {
      await api.patch(`/cobros/${cobroSeleccionado.id_cobro}/delete`);
      toast.success("Registro de cobro desactivado");
      recargar();
      if (typeof cerrarModalEliminar === "function") cerrarModalEliminar();
    } catch (error) {
      console.error("Error al desactivar cobro:", error);
      manejarErrorApi(error, "No se pudo desactivar el cobro.");
    } finally {
      setCargandoAccion(false);
    }
  };

  return {
    guardarCobro,
    ejecutarEliminacion,
    cargandoAccion,
  };
}
