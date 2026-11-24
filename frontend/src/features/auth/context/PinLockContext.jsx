/** @format */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

export const PinLockContext = createContext(null);

// Umbral de inactividad: 15 minutos sin uso piden el PIN (a confirmar con el odontólogo)
export const TIEMPO_INACTIVIDAD_MS = 15 * 60 * 1000;

export function PinLockProvider({ children }) {
  const { estaAutenticado, token } = useAuth();

  // Función para determinar si arranca bloqueado (Anti-bypass con F5)
  const verificarBloqueoInicial = () => {
    const tokenActivo = token || localStorage.getItem("token");
    if (!tokenActivo) return false;

    const ahora = Date.now();
    const unlocked = sessionStorage.getItem("pin_unlocked");
    const ultimaActividad = Number(localStorage.getItem("pin_last_activity"));

    // Si nunca se registró actividad previa, inicializarla en este instante
    if (!ultimaActividad) {
      localStorage.setItem("pin_last_activity", String(ahora));
      return false;
    }

    // 1. Si transcurrieron más de 15 minutos de inactividad, bloquear obligatoriamente
    if (ahora - ultimaActividad >= TIEMPO_INACTIVIDAD_MS) {
      sessionStorage.setItem("pin_unlocked", "false");
      return true;
    }

    // 2. Si la terminal fue bloqueada explícitamente por el usuario
    if (unlocked === "false") {
      return true;
    }

    return false;
  };

  const [isPinLocked, setIsPinLocked] = useState(verificarBloqueoInicial);
  const timerInactividadRef = useRef(null);
  const ultimaActividadRef = useRef(Date.now());

  // Función para bloquear la sesión
  const lock = useCallback(() => {
    sessionStorage.setItem("pin_unlocked", "false");
    setIsPinLocked(true);
  }, []);

  // Función para desbloquear tras ingresar PIN válido
  const unlock = useCallback(() => {
    const ahora = Date.now();
    // Actualizar inmediatamente flags y timestamp antes de desmontar para evitar re-bloqueo
    sessionStorage.setItem("pin_unlocked", "true");
    localStorage.setItem("pin_last_activity", String(ahora));
    localStorage.removeItem("pin_bloqueado_hasta");
    localStorage.removeItem("pin_intentos_fallidos");
    localStorage.removeItem("pin_intentos");
    localStorage.removeItem("pin_attempts");
    sessionStorage.removeItem("pin_attempts");
    sessionStorage.removeItem("pin_lockout_until");
    sessionStorage.removeItem("pin_permanent_lockout");

    ultimaActividadRef.current = ahora;
    setIsPinLocked(false);
  }, []);

  // Sincronización cuando cambia el estado de autenticación
  useEffect(() => {
    if (!estaAutenticado) {
      setIsPinLocked(false);
      sessionStorage.removeItem("pin_unlocked");
      return;
    }

    // Si está autenticado, evaluar estado de bloqueo
    const estaBloqueado = verificarBloqueoInicial();
    setIsPinLocked(estaBloqueado);
  }, [estaAutenticado]);

  // ─── DETECTOR DE INACTIVIDAD GLOBAL DE 15 MINUTOS ─────────────────
  useEffect(() => {
    if (!estaAutenticado || isPinLocked) {
      if (timerInactividadRef.current) {
        clearTimeout(timerInactividadRef.current);
      }
      return;
    }

    const resetTimer = () => {
      if (timerInactividadRef.current) {
        clearTimeout(timerInactividadRef.current);
      }
      timerInactividadRef.current = setTimeout(() => {
        lock();
      }, TIEMPO_INACTIVIDAD_MS);
    };

    resetTimer();

    // Eventos globales del usuario
    const eventos = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    let ultimoRegistro = Date.now();
    const handleActividad = () => {
      const ahora = Date.now();
      // Throttle de 2 segundos para no saturar localStorage
      if (ahora - ultimoRegistro > 2000) {
        ultimoRegistro = ahora;
        ultimaActividadRef.current = ahora;
        localStorage.setItem("pin_last_activity", String(ahora));
        resetTimer();
      }
    };

    eventos.forEach((evento) => {
      window.addEventListener(evento, handleActividad, { passive: true });
    });

    return () => {
      if (timerInactividadRef.current) {
        clearTimeout(timerInactividadRef.current);
      }
      eventos.forEach((evento) => {
        window.removeEventListener(evento, handleActividad);
      });
    };
  }, [estaAutenticado, isPinLocked, lock]);

  return (
    <PinLockContext.Provider
      value={{
        isPinLocked,
        lock,
        unlock,
        bloquearSesion: lock,
        desbloquearSesion: unlock,
      }}
    >
      {children}
    </PinLockContext.Provider>
  );
}

export function usePinLock() {
  const context = useContext(PinLockContext);
  if (!context) {
    throw new Error("usePinLock debe utilizarse dentro de un PinLockProvider");
  }
  return context;
}

export default PinLockContext;
