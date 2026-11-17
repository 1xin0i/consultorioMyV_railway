/** @format */

import { useState, useMemo, useCallback } from "react";
import VistaDia from "./VistaDia";
import VistaSemana from "./VistaSemana";
import VistaMes from "./VistaMes";
import { AgendaHeader, AgendaFabMobile } from "./AgendaHeader";
import ModalRestriccion from "../modales/ModalRestriccion";
import useInteractiveSwipe from "@/shared/hooks/useInteractiveSwipe";
import { useConfiguracion } from "@/features/configuracion";
import { GENERAR_HORAS, esSlotPasado } from "../../utils/agendaStyles";
import { useRestricciones } from "../../hooks/useRestricciones";
import { useCalendarioSeleccion } from "../../hooks/useCalendarioSeleccion";

const capitalizar = (texto) =>
  texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;

const esTurnoCancelado = (t) => {
  const estado = (t.EstadoTurno?.estado || "").toLowerCase();
  if (estado) return estado.includes("cancelado");
  return Number(t.id_estado) === 3;
};

export function AgendaCalendario({
  turnos = [],
  onSelectSlot,
  onEventClick,
  onNuevoTurno,
}) {
  const [vista, setVista] = useState("dia");
  const [fechaActual, setFechaActual] = useState(() => new Date());

  // Los cancelados no ocupan la franja: se ocultan salvo que se pida verlos
  const [mostrarCancelados, setMostrarCancelados] = useState(() => {
    try {
      return localStorage.getItem("agenda_mostrar_cancelados") === "1";
    } catch {
      return false;
    }
  });

  const cambiarMostrarCancelados = useCallback((valor) => {
    setMostrarCancelados(valor);
    try {
      localStorage.setItem("agenda_mostrar_cancelados", valor ? "1" : "0");
    } catch {
      // sin almacenamiento: la preferencia dura mientras la página esté abierta
    }
  }, []);

  const turnosVisibles = useMemo(
    () =>
      mostrarCancelados ? turnos : turnos.filter((t) => !esTurnoCancelado(t)),
    [turnos, mostrarCancelados],
  );

  const [modalRestriccionAbierto, setModalRestriccionAbierto] = useState(false);
  const [rangoParaBloquear, setRangoParaBloquear] = useState(null);

  const {
    agregarRestriccion,
    eliminarRestriccion,
    esDiaBloqueado,
    obtenerRestriccionDia,
    esSlotBloqueado,
    obtenerRestriccionSlot,
  } = useRestricciones();

  const { configuracion, horaInicioNum, horaFinNum, esDiaLaboral } =
    useConfiguracion();

  const slotsHoras = useMemo(
    () =>
      GENERAR_HORAS(
        horaInicioNum,
        horaFinNum,
        configuracion?.intervaloMinutos || 30,
      ),
    [horaInicioNum, horaFinNum, configuracion?.intervaloMinutos],
  );

  const abrirModalRestriccion = useCallback((rango) => {
    setRangoParaBloquear(rango);
    setModalRestriccionAbierto(true);
  }, []);

  const {
    estaArrastrando,
    estaSeleccionado,
    iniciarSeleccion,
    moverSeleccion,
    finalizarSeleccion,
    handleSlotTouchStart,
    handleSlotTouchMove,
    handleSlotTouchEnd,
    handleSlotTouchCancel,
    resetSeleccion,
    estaDiaMarcado,
    iniciarPresionDia,
    moverPresionDiaMouse,
    moverPresionDiaTouch,
    debeIgnorarClickDia,
  } = useCalendarioSeleccion({
    onSelectSlot,
    onSelectDaysToBlock: abrirModalRestriccion,
    slotsHoras,
  });

  const irHoy = useCallback(() => setFechaActual(new Date()), []);

  const irAnterior = useCallback(() => {
    setFechaActual((prev) => {
      const nueva = new Date(prev);
      if (vista === "dia") nueva.setDate(nueva.getDate() - 1);
      else if (vista === "semana") nueva.setDate(nueva.getDate() - 7);
      else if (vista === "mes") nueva.setMonth(nueva.getMonth() - 1);
      return nueva;
    });
  }, [vista]);

  const irSiguiente = useCallback(() => {
    setFechaActual((prev) => {
      const nueva = new Date(prev);
      if (vista === "dia") nueva.setDate(nueva.getDate() + 1);
      else if (vista === "semana") nueva.setDate(nueva.getDate() + 7);
      else if (vista === "mes") nueva.setMonth(nueva.getMonth() + 1);
      return nueva;
    });
  }, [vista]);

  const { containerRef: swipeContainerRef, swipeHandlers } =
    useInteractiveSwipe({
      onSwipeLeft: irSiguiente,
      onSwipeRight: irAnterior,
      disabled: estaArrastrando,
      threshold: 55,
    });

  const handleSelectDayEnMes = useCallback((fecha) => {
    setFechaActual(fecha);
    setVista("dia");
  }, []);

  const tituloPeriodo = useMemo(() => {
    if (vista === "dia") {
      return fechaActual.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (vista === "semana") {
      const diaSemana = fechaActual.getDay();
      const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
      const lunes = new Date(fechaActual);
      lunes.setDate(fechaActual.getDate() + diffLunes);
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);

      const fmtCorto = (f) =>
        f.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
      return `${fmtCorto(lunes)} – ${fmtCorto(domingo)} ${domingo.getFullYear()}`;
    }
    return fechaActual.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
  }, [fechaActual, vista]);

  const tituloLargo = useMemo(() => capitalizar(tituloPeriodo), [tituloPeriodo]);

  const tituloCorto = useMemo(() => {
    if (vista !== "dia") return tituloLargo;
    return capitalizar(
      fechaActual.toLocaleDateString("es-AR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    );
  }, [vista, fechaActual, tituloLargo]);

  const diasSemana = useMemo(() => {
    const diaSemana = fechaActual.getDay();
    const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    const lunes = new Date(fechaActual);
    lunes.setDate(fechaActual.getDate() + diffLunes);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
  }, [fechaActual]);

  return (
    <div className="w-full h-full flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col">
      <AgendaHeader
        vista={vista}
        setVista={setVista}
        tituloPeriodo={tituloLargo}
        tituloCorto={tituloCorto}
        mostrarCancelados={mostrarCancelados}
        setMostrarCancelados={cambiarMostrarCancelados}
        irAnterior={irAnterior}
        irHoy={irHoy}
        irSiguiente={irSiguiente}
        onNuevoTurno={onNuevoTurno}
        resetSeleccion={resetSeleccion}
      />

      <div
        ref={swipeContainerRef}
        className={`flex-1 min-h-0 relative bg-white dark:bg-slate-900 touch-pan-y flex flex-col will-change-transform ${
          vista === "dia" ? "overflow-y-auto" : "overflow-hidden"
        }`}
        {...swipeHandlers}
      >
        {vista === "dia" && (
          <VistaDia
            fechaActual={fechaActual}
            turnos={turnosVisibles}
            esSlotPasado={esSlotPasado}
            estaSeleccionado={estaSeleccionado}
            iniciarSeleccion={iniciarSeleccion}
            moverSeleccion={moverSeleccion}
            finalizarSeleccion={finalizarSeleccion}
            handleSlotTouchStart={handleSlotTouchStart}
            handleSlotTouchMove={handleSlotTouchMove}
            handleSlotTouchEnd={handleSlotTouchEnd}
            handleSlotTouchCancel={handleSlotTouchCancel}
            onEventClick={onEventClick}
            slotsHoras={slotsHoras}
            horaInicioAgenda={horaInicioNum}
            esDiaLaboral={esDiaLaboral}
            esDiaBloqueado={esDiaBloqueado}
            obtenerRestriccionDia={obtenerRestriccionDia}
            esSlotBloqueado={esSlotBloqueado}
            obtenerRestriccionSlot={obtenerRestriccionSlot}
            onBloquearDia={(f) => abrirModalRestriccion({ inicio: f, fin: f })}
            onEliminarRestriccion={eliminarRestriccion}
          />
        )}

        {vista === "semana" && (
          <VistaSemana
            diasSemana={diasSemana}
            turnos={turnosVisibles}
            setFechaActual={setFechaActual}
            setVista={setVista}
            esSlotPasado={esSlotPasado}
            estaSeleccionado={estaSeleccionado}
            iniciarSeleccion={iniciarSeleccion}
            moverSeleccion={moverSeleccion}
            finalizarSeleccion={finalizarSeleccion}
            handleSlotTouchStart={handleSlotTouchStart}
            handleSlotTouchMove={handleSlotTouchMove}
            handleSlotTouchEnd={handleSlotTouchEnd}
            handleSlotTouchCancel={handleSlotTouchCancel}
            onEventClick={onEventClick}
            onSelectDay={handleSelectDayEnMes}
            slotsHoras={slotsHoras}
            horaInicioAgenda={horaInicioNum}
            esDiaLaboral={esDiaLaboral}
            esDiaBloqueado={esDiaBloqueado}
            obtenerRestriccionDia={obtenerRestriccionDia}
            esSlotBloqueado={esSlotBloqueado}
            obtenerRestriccionSlot={obtenerRestriccionSlot}
            onEliminarRestriccion={eliminarRestriccion}
            onBloquearDia={(inicio, fin) =>
              abrirModalRestriccion({ inicio, fin: fin || inicio })
            }
            estaDiaMarcado={estaDiaMarcado}
            iniciarPresionDia={iniciarPresionDia}
            moverPresionDiaMouse={moverPresionDiaMouse}
            moverPresionDiaTouch={moverPresionDiaTouch}
            debeIgnorarClickDia={debeIgnorarClickDia}
          />
        )}

        {vista === "mes" && (
          <VistaMes
            fechaActual={fechaActual}
            turnos={turnos}
            onSelectDay={handleSelectDayEnMes}
            onSelectRangeToBlock={abrirModalRestriccion}
            onEliminarRestriccion={eliminarRestriccion}
            estaDiaMarcado={estaDiaMarcado}
            iniciarPresionDia={iniciarPresionDia}
            moverPresionDiaMouse={moverPresionDiaMouse}
            moverPresionDiaTouch={moverPresionDiaTouch}
            debeIgnorarClickDia={debeIgnorarClickDia}
          />
        )}
      </div>

      <AgendaFabMobile
        fechaActual={fechaActual}
        onNuevoTurno={onNuevoTurno}
        abrirModalRestriccion={abrirModalRestriccion}
      />

      <ModalRestriccion
        isOpen={modalRestriccionAbierto}
        onClose={() => setModalRestriccionAbierto(false)}
        rangoFechas={rangoParaBloquear}
        onGuardar={agregarRestriccion}
        onEliminar={eliminarRestriccion}
      />
    </div>
  );
}

export default AgendaCalendario;
