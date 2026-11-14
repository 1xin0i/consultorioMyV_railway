/** @format */

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { manejarErrorApi } from "@/shared/utils/errorHandler";
import cobrosApi from "../services/cobros.api";
import { turnosApi } from "@/features/turnos";

export const obtenerFechaHoyLocal = () => {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export function useRegistrarPago({
  isOpen,
  onClose,
  turnoPreseleccionado = null,
  turnosAtendidos = [],
  onPagoExitoso,
}) {
  const [tipoIngreso, setTipoIngreso] = useState("turno");
  const [turnoElegido, setTurnoElegido] = useState(null);
  const [turnosPendientesLista, setTurnosPendientesLista] = useState([]);
  const [cobrosPrevios, setCobrosPrevios] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [montoAbonar, setMontoAbonar] = useState("");
  const [medioPago, setMedioPago] = useState("Efectivo");
  const [metodoPagoId, setMetodoPagoId] = useState(1);
  const [metodosPagoLista, setMetodosPagoLista] = useState([
    { id: 1, nombre: "Efectivo" },
    { id: 2, nombre: "Transferencia" },
    { id: 3, nombre: "Tarjeta" },
    { id: 4, nombre: "Otro" },
  ]);
  const [fechaCobro, setFechaCobro] = useState(obtenerFechaHoyLocal);
  const [conceptoInformal, setConceptoInformal] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Cargar métodos de pago desde la API / BD
  useEffect(() => {
    cobrosApi
      .obtenerMetodosPago()
      .then((res) => {
        const lista = res.data?.data || [];
        if (Array.isArray(lista) && lista.length > 0) {
          setMetodosPagoLista(lista);
          if (!medioPago || medioPago === "Efectivo") {
            const primero = lista[0];
            setMedioPago(primero.nombre);
            setMetodoPagoId(primero.id);
          }
        }
      })
      .catch(() => {
        // Mantener métodos por defecto
      });
  }, []);

  const seleccionarMetodoPago = (metodo) => {
    if (typeof metodo === "object" && metodo !== null) {
      setMedioPago(metodo.nombre);
      setMetodoPagoId(metodo.id);
    } else {
      setMedioPago(metodo);
      const enc = metodosPagoLista.find((m) => m.nombre === metodo);
      if (enc) setMetodoPagoId(enc.id);
    }
  };

  // Sincronizar al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    setFechaCobro(obtenerFechaHoyLocal());
    setConceptoInformal("");
    setObservaciones("");

    if (turnoPreseleccionado) {
      setTipoIngreso("turno");
      setTurnoElegido(turnoPreseleccionado);
    } else {
      setTipoIngreso("turno");
      setTurnoElegido(null);
      setCobrosPrevios([]);
      setMontoAbonar("");
    }
  }, [isOpen, turnoPreseleccionado]);

  // Cargar turnos atendidos con saldo pendiente cuando se abre desde Caja sin turno fijo
  useEffect(() => {
    if (!isOpen || turnoPreseleccionado) return;

    if (Array.isArray(turnosAtendidos) && turnosAtendidos.length > 0) {
      const conSaldo = turnosAtendidos.filter((t) => {
        const sc = t.SolicitudCobro;
        if (!sc) return Number(t.precio_final || 0) > 0;
        return Number(sc.saldo_pendiente) > 0;
      });
      setTurnosPendientesLista(conSaldo);
    } else {
      turnosApi
        .listarAtendidos()
        .then((res) => {
          const lista = res.data?.data || [];
          const conSaldo = lista.filter((t) => {
            const sc = t.SolicitudCobro;
            if (!sc) return Number(t.precio_final || 0) > 0;
            return Number(sc.saldo_pendiente) > 0;
          });
          setTurnosPendientesLista(conSaldo);
        })
        .catch(() => setTurnosPendientesLista([]));
    }
  }, [isOpen, turnoPreseleccionado, turnosAtendidos]);

  // Cargar cobros previos cuando cambia el turno elegido
  useEffect(() => {
    if (!isOpen || !turnoElegido?.id_turno) {
      setCobrosPrevios([]);
      return;
    }

    const idT = turnoElegido.id_turno;
    setCargandoDetalle(true);

    cobrosApi
      .obtenerCobrosDeTurno(idT)
      .then((res) => {
        const listaCobros = res.data?.data || [];
        setCobrosPrevios(listaCobros);

        const pagadoHistorico = listaCobros.reduce(
          (acc, c) => acc + Number(c.monto_pagado || 0),
          0,
        );
        const montoTotalBase = Number(
          turnoElegido.SolicitudCobro?.monto_total ??
            turnoElegido.SolicitudCobro?.monto_a_cobrar ??
            turnoElegido.precio_final ??
            0,
        );
        const saldoCalc =
          turnoElegido.SolicitudCobro?.saldo_pendiente !== undefined
            ? Number(turnoElegido.SolicitudCobro.saldo_pendiente)
            : Math.max(0, montoTotalBase - pagadoHistorico);

        setMontoAbonar(saldoCalc > 0 ? String(saldoCalc) : "");
      })
      .catch(() => {
        setCobrosPrevios([]);
        const saldoFallback = Number(
          turnoElegido.SolicitudCobro?.saldo_pendiente ??
            turnoElegido.precio_final ??
            0,
        );
        setMontoAbonar(saldoFallback > 0 ? String(saldoFallback) : "");
      })
      .finally(() => {
        setCargandoDetalle(false);
      });
  }, [isOpen, turnoElegido]);

  const resumenFinanciero = useMemo(() => {
    if (!turnoElegido) {
      return {
        montoTotal: 0,
        montoAbonadoPrevio: 0,
        saldoPendienteActual: 0,
        saldoRestanteLuegoDePago: 0,
      };
    }

    const pagadoEnLista = cobrosPrevios.reduce(
      (acc, c) => acc + Number(c.monto_pagado || 0),
      0,
    );

    const sc = turnoElegido.SolicitudCobro;
    const montoTotal = Number(
      sc?.monto_total ?? sc?.monto_a_cobrar ?? turnoElegido.precio_final ?? 0,
    );

    const saldoPendienteActual =
      sc?.saldo_pendiente !== undefined && cobrosPrevios.length === 0
        ? Number(sc.saldo_pendiente)
        : Math.max(0, Number((montoTotal - pagadoEnLista).toFixed(2)));

    const montoAbonadoPrevio = Math.max(
      0,
      Number((montoTotal - saldoPendienteActual).toFixed(2)),
    );

    const abonoActualNum = parseFloat(montoAbonar) || 0;
    const saldoRestanteLuegoDePago = Math.max(
      0,
      Number((saldoPendienteActual - abonoActualNum).toFixed(2)),
    );

    return {
      montoTotal,
      montoAbonadoPrevio,
      saldoPendienteActual,
      saldoRestanteLuegoDePago,
    };
  }, [turnoElegido, cobrosPrevios, montoAbonar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(montoAbonar);

    if (!montoNum || montoNum <= 0) {
      toast.error("El monto a abonar debe ser mayor a $0.");
      return;
    }

    if (!medioPago) {
      toast.error("Seleccioná un medio de pago.");
      return;
    }

    setEnviando(true);
    try {
      if (tipoIngreso === "informal") {
        if (!conceptoInformal.trim()) {
          toast.error("El concepto del ingreso informal es obligatorio.");
          setEnviando(false);
          return;
        }

        await cobrosApi.crearCobroInformal({
          concepto: conceptoInformal.trim(),
          monto_pagado: montoNum,
          medio_pago: medioPago,
          fecha_cobro: fechaCobro,
          observaciones: observaciones.trim() || null,
        });

        toast.success("Ingreso informal registrado en Caja correctamente.");
      } else {
        if (!turnoElegido?.id_turno) {
          toast.error("Seleccioná un turno atendido para registrar el pago.");
          setEnviando(false);
          return;
        }

        if (montoNum > resumenFinanciero.saldoPendienteActual + 0.01) {
          toast.error(
            `El monto ingresado ($${montoNum.toLocaleString("es-AR")}) supera el saldo pendiente ($${resumenFinanciero.saldoPendienteActual.toLocaleString("es-AR")}).`,
          );
          setEnviando(false);
          return;
        }

        await cobrosApi.registrarPago({
          id_turno: Number(turnoElegido.id_turno),
          monto: montoNum,
          monto_a_cobrar: montoNum,
          monto_abonado: montoNum,
          metodo_pago: medioPago,
          metodo_pago_id: metodoPagoId,
          fecha_cobro: fechaCobro,
          observaciones: observaciones.trim() || null,
        });

        const quedaSaldado =
          resumenFinanciero.saldoPendienteActual - montoNum <= 0.01;
        toast.success(
          quedaSaldado
            ? "¡Pago total registrado! El turno quedó saldado."
            : "Entrega parcial registrada. El saldo pendiente fue actualizado.",
        );
      }

      if (onPagoExitoso) onPagoExitoso();
      onClose();
    } catch (error) {
      manejarErrorApi(error, "No se pudo registrar el pago.");
    } finally {
      setEnviando(false);
    }
  };

  const nombrePaciente = turnoElegido?.Paciente
    ? `${turnoElegido.Paciente.nombre} ${turnoElegido.Paciente.apellido}`.trim()
    : "";

  const practicasDelTurno = turnoElegido?.PracticaTurnos || [];

  return {
    tipoIngreso,
    setTipoIngreso,
    turnoElegido,
    setTurnoElegido,
    turnosPendientesLista,
    cobrosPrevios,
    cargandoDetalle,
    enviando,
    montoAbonar,
    setMontoAbonar,
    medioPago,
    setMedioPago,
    metodoPagoId,
    setMetodoPagoId,
    metodosPagoLista,
    seleccionarMetodoPago,
    fechaCobro,
    setFechaCobro,
    conceptoInformal,
    setConceptoInformal,
    observaciones,
    setObservaciones,
    resumenFinanciero,
    handleSubmit,
    nombrePaciente,
    practicasDelTurno,
  };
}

