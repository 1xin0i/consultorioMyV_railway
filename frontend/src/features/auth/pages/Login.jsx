/** @format */

import { useState, useRef, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import logoImg from "@/assets/logo.png";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  Clock,
  ScanFace,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePinLock } from "../context/PinLockContext";
import authApi from "../services/auth.api";

// Detección de hardware de PC de escritorio vs móvil para biometría
const esDispositivoEscritorioReal = () => {
  try {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(any-pointer: fine)").matches &&
      !window.matchMedia("(any-pointer: coarse)").matches
    ) {
      return true;
    }
    if (typeof navigator !== "undefined") {
      const plataforma =
        navigator.userAgentData?.platform || navigator.platform || "";
      if (/Win|MacIntel|Linux x86_64/i.test(plataforma)) {
        return true;
      }
    }
  } catch (e) {
    console.warn("[Auth] Error en detección de hardware:", e);
  }
  return false;
};

export function Login({ vistaInicial, onUnlock }) {
  const { login, estaAutenticado, logout } = useAuth();
  const { isPinLocked, unlock: ctxUnlock } = usePinLock();
  const navigate = useNavigate();
  const location = useLocation();

  const handleUnlock = onUnlock || ctxUnlock;

  // Control de vista activa (pin | login | recuperar_password)
  const [vista, setVista] = useState(() => {
    if (vistaInicial) return vistaInicial;
    if (estaAutenticado && isPinLocked) return "pin";
    return "login";
  });

  // ─── ESTADOS VISTA B: PIN DE ACCESO ──────────────────────────────
  const [pin, setPin] = useState("");
  const [errorPin, setErrorPin] = useState("");
  const [mensajeExitoPin, setMensajeExitoPin] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isValidatingPin, setIsValidatingPin] = useState(false);

  const obtenerTiempoBloqueoRestante = () => {
    const tiempoBloqueo = localStorage.getItem("pin_bloqueado_hasta");
    if (!tiempoBloqueo) return 0;
    const tiempoNum = Number(tiempoBloqueo);
    if (isNaN(tiempoNum) || Date.now() >= tiempoNum) {
      localStorage.removeItem("pin_bloqueado_hasta");
      localStorage.removeItem("pin_intentos_fallidos");
      return 0;
    }
    return Math.ceil((tiempoNum - Date.now()) / 1000);
  };

  const [segundosBloqueo, setSegundosBloqueo] = useState(() =>
    obtenerTiempoBloqueoRestante(),
  );
  const [bloqueado, setBloqueado] = useState(
    () => obtenerTiempoBloqueoRestante() > 0,
  );
  const [intentosFallidos, setIntentosFallidos] = useState(() => {
    if (obtenerTiempoBloqueoRestante() > 0) return 3;
    const guardados = Number(localStorage.getItem("pin_intentos_fallidos")) || 0;
    return guardados < 3 ? guardados : 0;
  });

  const pinInputRef = useRef(null);

  // Estados Face ID / Biometría
  const [isScanningFaceId, setIsScanningFaceId] = useState(false);
  const [faceIdSuccess, setFaceIdSuccess] = useState(false);
  const [isMobileView, setIsMobileView] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Temporizador regresivo de 15 minutos de bloqueo de PIN
  useEffect(() => {
    if (!bloqueado) return;

    const interval = setInterval(() => {
      const restante = obtenerTiempoBloqueoRestante();
      if (restante <= 0) {
        clearInterval(interval);
        setBloqueado(false);
        setSegundosBloqueo(0);
        setIntentosFallidos(0);
        setErrorPin("");
      } else {
        setSegundosBloqueo(restante);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bloqueado]);

  // Autofoco al entrar a la vista de PIN
  useEffect(() => {
    if (vista === "pin" && !bloqueado) {
      const timer = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [vista, bloqueado]);

  // Sincronización de vista según props y estado de bloqueo
  useEffect(() => {
    if (vistaInicial) {
      setVista(vistaInicial);
    } else if (estaAutenticado && isPinLocked) {
      setVista("pin");
    }
  }, [vistaInicial, estaAutenticado, isPinLocked]);

  // ─── ESTADOS VISTA A: LOGIN MAESTRO (EMAIL + CONTRASEÑA) ──────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [alertaSeguridad, setAlertaSeguridad] = useState("");

  // ─── ESTADOS VISTA C: RECUPERACIÓN POR CORREO ─────────────────────
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [cargandoEmail, setCargandoEmail] = useState(false);
  const [errorEmail, setErrorEmail] = useState("");
  const [segundosBloqueoRecuperacion, setSegundosBloqueoRecuperacion] = useState(
    () => {
      const bloqueoHasta = localStorage.getItem("bloqueo_recuperacion_hasta");
      if (bloqueoHasta) {
        const restante = Math.ceil((Number(bloqueoHasta) - Date.now()) / 1000);
        if (restante > 0) return restante;
        localStorage.removeItem("bloqueo_recuperacion_hasta");
        localStorage.removeItem("intentos_recuperacion_email");
      }
      return 0;
    },
  );

  const [codigoRecuperacion, setCodigoRecuperacion] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [passwordRestablecida, setPasswordRestablecida] = useState(false);
  const [cargandoRestablecer, setCargandoRestablecer] = useState(false);
  const [errorRestablecer, setErrorRestablecer] = useState("");

  const destino = location.state?.from?.pathname || "/";

  // Higiene de memoria al desmontar
  useEffect(() => {
    return () => {
      setPassword("");
      setPin("");
      setError("");
      setErrorPin("");
      setErrorEmail("");
      setCodigoRecuperacion("");
      setNuevaPassword("");
      setConfirmarPassword("");
      setErrorRestablecer("");
      setMensajeExito("");
    };
  }, []);

  // Temporizador de 15 minutos tras 3 intentos en recuperación
  useEffect(() => {
    const checkBloqueo = () => {
      const bloqueoHasta = localStorage.getItem("bloqueo_recuperacion_hasta");
      if (!bloqueoHasta) {
        setSegundosBloqueoRecuperacion(0);
        return;
      }
      const restante = Math.ceil((Number(bloqueoHasta) - Date.now()) / 1000);
      if (restante <= 0) {
        localStorage.removeItem("bloqueo_recuperacion_hasta");
        localStorage.removeItem("intentos_recuperacion_email");
        setSegundosBloqueoRecuperacion(0);
      } else {
        setSegundosBloqueoRecuperacion(restante);
      }
    };

    checkBloqueo();
    const timer = setInterval(checkBloqueo, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Si está autenticado y NO está bloqueado por PIN, redirigir a destino
  if (estaAutenticado && !isPinLocked) {
    return <Navigate to={destino} replace />;
  }

  // ─── TRANSICIONES DE VISTA ────────────────────────────────────────
  const handleIrAContraseña = (alerta = "") => {
    setPin("");
    setErrorPin("");
    setPassword("");
    setError("");
    if (alerta) setAlertaSeguridad(alerta);
    // Si la sesión estaba autenticada y bloqueada, cerrar sesión para que ingrese limpiamente
    if (estaAutenticado) {
      logout();
    }
    setVista("login");
  };

  const handleVolverAPin = () => {
    setError("");
    setPassword("");
    setPin("");
    setErrorPin("");
    setVista("pin");
  };

  const handleIrARecuperarEmail = () => {
    setPassword("");
    setError("");
    setMensajeExito("");
    setErrorEmail("");
    setEmailEnviado(false);
    setCodigoRecuperacion("");
    setNuevaPassword("");
    setConfirmarPassword("");
    setPasswordRestablecida(false);
    setErrorRestablecer("");
    setVista("recuperar_password");
  };

  const handleVolverAIniciarSesion = () => {
    setErrorEmail("");
    setEmailEnviado(false);
    setCodigoRecuperacion("");
    setNuevaPassword("");
    setConfirmarPassword("");
    setPasswordRestablecida(false);
    setErrorRestablecer("");
    setPassword("");
    setError("");
    setMensajeExito("");
    setVista("login");
  };

  // ─── ACCIONES VISTA B: VALIDACIÓN DE PIN ──────────────────────────
  const validarPinValor = async (enteredPin) => {
    if (bloqueado || isValidatingPin) return;

    setIsValidatingPin(true);
    setErrorPin("");
    setMensajeExitoPin("");

    try {
      await authApi.validarPin(enteredPin);

      // CRÍTICO: Registrar inmediatamente el timestamp de actividad y bandera desbloqueada ANTES de desmontar
      const ahora = Date.now();
      sessionStorage.setItem("pin_unlocked", "true");
      localStorage.setItem("pin_last_activity", String(ahora));

      // Purga completa de penalizaciones
      localStorage.removeItem("pin_bloqueado_hasta");
      localStorage.removeItem("pin_intentos_fallidos");
      localStorage.removeItem("pin_intentos");
      localStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_lockout_until");
      sessionStorage.removeItem("pin_permanent_lockout");

      // Limpieza total del formulario de PIN para que aparezca limpio desde cero en futuros bloqueos
      setIntentosFallidos(0);
      setBloqueado(false);
      setSegundosBloqueo(0);
      setPin("");
      setErrorPin("");
      setMensajeExitoPin("");
      setIsValidatingPin(false);

      // Desbloquear en el contexto global
      if (handleUnlock) {
        handleUnlock();
      }

      // Redirección inmediata a la agenda o ruta previa
      const rutaDestino =
        location.pathname === "/login"
          ? (location.state?.from?.pathname || "/")
          : (location.pathname || "/");

      navigate(rutaDestino, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      setIsShaking(true);
      setPin("");
      setIsValidatingPin(false);
      setTimeout(() => setIsShaking(false), 400);

      if (status === 429) {
        const hasta = Date.now() + 15 * 60 * 1000;
        localStorage.setItem("pin_bloqueado_hasta", String(hasta));
        localStorage.setItem("pin_intentos_fallidos", "3");
        setBloqueado(true);
        setSegundosBloqueo(15 * 60);
        setIntentosFallidos(3);
        setErrorPin(
          "Has superado los 3 intentos permitidos. El acceso por PIN ha sido bloqueado por 15 minutos.",
        );
        return;
      }

      const nuevosFallos = intentosFallidos + 1;
      setIntentosFallidos(nuevosFallos);
      localStorage.setItem("pin_intentos_fallidos", String(nuevosFallos));

      if (nuevosFallos >= 3) {
        const hasta = Date.now() + 15 * 60 * 1000;
        localStorage.setItem("pin_bloqueado_hasta", String(hasta));
        setBloqueado(true);
        setSegundosBloqueo(15 * 60);
        setErrorPin(
          "Has superado los 3 intentos permitidos. El acceso por PIN ha sido bloqueado por 15 minutos.",
        );
      } else {
        const restantes = 3 - nuevosFallos;
        const textoError =
          restantes === 1
            ? "PIN incorrecto. Te queda 1 intento."
            : `PIN incorrecto. Te quedan ${restantes} intentos.`;
        setErrorPin(textoError);

        setTimeout(() => {
          if (pinInputRef.current && !bloqueado) {
            pinInputRef.current.focus();
          }
        }, 300);
      }
    }
  };

  const handlePinChange = (e) => {
    if (bloqueado || isValidatingPin) return;
    setErrorPin("");
    setMensajeExitoPin("");
    const cleanValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setPin(cleanValue);
    if (cleanValue.length === 4) {
      validarPinValor(cleanValue);
    }
  };

  const handleFaceIdLogin = async () => {
    if (esDispositivoEscritorioReal()) {
      return;
    }
    if (bloqueado || isScanningFaceId || isValidatingPin) return;

    setIsScanningFaceId(true);
    setErrorPin("");
    setMensajeExitoPin("");

    try {
      if (
        !window.PublicKeyCredential ||
        !window.isSecureContext ||
        typeof window.PublicKeyCredential
          .isUserVerifyingPlatformAuthenticatorAvailable !== "function"
      ) {
        setIsScanningFaceId(false);
        return;
      }

      const tienePlataforma =
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!tienePlataforma) {
        setIsScanningFaceId(false);
        return;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
          rpId: window.location.hostname,
        },
      });

      if (credential) {
        setFaceIdSuccess(true);
        const ahora = Date.now();
        sessionStorage.setItem("pin_unlocked", "true");
        localStorage.setItem("pin_last_activity", String(ahora));
        localStorage.removeItem("pin_bloqueado_hasta");
        localStorage.removeItem("pin_intentos_fallidos");
        setPin("");
        setErrorPin("");
        setMensajeExitoPin("");

        setTimeout(() => {
          if (handleUnlock) handleUnlock();
          const rutaDestino =
            location.pathname === "/login"
              ? (location.state?.from?.pathname || "/")
              : (location.pathname || "/");
          navigate(rutaDestino, { replace: true });
        }, 300);
      }
    } catch (err) {
      console.warn("[Auth] Error en Face ID:", err);
    } finally {
      setIsScanningFaceId(false);
    }
  };

  // ─── ACCIONES VISTA A: LOGIN MAESTRO ──────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;

    setError("");
    setMensajeExito("");

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setError("Por favor, ingresá tu correo electrónico.");
      return;
    }

    if (!password.trim()) {
      setError("Por favor, ingresá tu contraseña para desbloquear el sistema.");
      return;
    }

    setCargando(true);

    try {
      await login(emailTrimmed, password);
      setPassword("");
      const ahora = Date.now();
      sessionStorage.setItem("pin_unlocked", "true");
      localStorage.setItem("pin_last_activity", String(ahora));
      if (handleUnlock) handleUnlock();
      navigate(destino, { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Credenciales inválidas. Verificá tu correo y contraseña.";
      setError(errorMsg);
    } finally {
      setCargando(false);
    }
  };

  // ─── ACCIONES VISTA C: RECUPERACIÓN POR EMAIL ─────────────────────
  const handleRecuperarPassword = async (e) => {
    if (e) e.preventDefault();
    if (cargandoEmail || segundosBloqueoRecuperacion > 0) return;

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setErrorEmail("Por favor, ingresá el correo electrónico.");
      return;
    }

    setErrorEmail("");
    setCargandoEmail(true);

    try {
      await authApi.recuperarPassword({
        email: emailTrimmed,
        usuario: emailTrimmed,
      });

      setEmailEnviado(true);
      setMensajeExito(
        `Se enviaron las instrucciones a ${emailTrimmed}. Verificá tu bandeja de entrada o spam.`,
      );
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        const hasta = Date.now() + 15 * 60 * 1000;
        localStorage.setItem("bloqueo_recuperacion_hasta", String(hasta));
        setSegundosBloqueoRecuperacion(15 * 60);
        setErrorEmail(
          "Superaste los 3 intentos permitidos para recuperar contraseña. Intenta nuevamente en 15 minutos.",
        );
        return;
      }
      setErrorEmail(
        err.response?.data?.mensaje ||
          "Error al enviar correo. Verificá que la dirección sea correcta.",
      );
    } finally {
      setCargandoEmail(false);
    }
  };

  const handleRestablecerPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (cargandoRestablecer) return;
    setErrorRestablecer("");

    if (codigoRecuperacion.length !== 6) {
      setErrorRestablecer(
        "El código debe tener exactamente 6 dígitos numéricos.",
      );
      return;
    }

    if (nuevaPassword.length < 8) {
      setErrorRestablecer(
        "La nueva contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    if (
      !/[A-Z]/.test(nuevaPassword) ||
      !/[a-z]/.test(nuevaPassword) ||
      !/[0-9]/.test(nuevaPassword) ||
      !/[^A-Za-z0-9]/.test(nuevaPassword)
    ) {
      setErrorRestablecer(
        "La contraseña debe contener mayúscula, minúscula, número y un carácter especial.",
      );
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorRestablecer("Las contraseñas no coinciden.");
      return;
    }

    setCargandoRestablecer(true);

    try {
      const res = await authApi.restablecerPassword({
        codigo: codigoRecuperacion,
        token: codigoRecuperacion,
        pin: codigoRecuperacion,
        nuevaPassword,
        nueva_password: nuevaPassword,
        password: nuevaPassword,
      });

      setPasswordRestablecida(true);
      setMensajeExito(
        res?.mensaje || "Contraseña actualizada exitosamente.",
      );
    } catch (err) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Código inválido o expirado. Verificá los 6 dígitos recibidos.";
      setErrorRestablecer(msg);
    } finally {
      setCargandoRestablecer(false);
    }
  };

  const tieneSesionPrevia = Boolean(
    localStorage.getItem("token") || localStorage.getItem("jwt_dispositivo"),
  );

  return (
    <div className="w-full h-[100dvh] overflow-hidden overscroll-none touch-none select-none flex flex-col lg:flex-row bg-white font-sans relative ">
      {/* ══════════════════════════════════════════════════════════════
          RESPLANDORES DIFUMINADOS CONTINUOS (AMBIENT GLOW REAL)
          Efecto etéreo sin cortes rectangulares ni divisiones duras
      ══════════════════════════════════════════════════════════════ */}
      {/* Resplandor Esquina Superior Derecha */}
      <div className="absolute top-[-80px] right-[-80px] lg:top-[-100px] lg:right-[-60px] w-80 sm:w-96 lg:w-[480px] h-80 sm:h-96 lg:h-[480px] rounded-full bg-gradient-to-br from-teal-400/20 via-sky-400/15 to-transparent blur-3xl pointer-events-none" />

      {/* Resplandor Lateral Izquierdo Central */}
      <div className="absolute top-10 left-[-60px] sm:left-[-80px] lg:top-1/4 lg:left-[-100px] w-72 sm:w-80 lg:w-[440px] h-72 sm:h-80 lg:h-[440px] rounded-full bg-teal-200/15 blur-3xl pointer-events-none" />

      {/* Resplandor Esquina Inferior Izquierda (Equiparado exactamente con el Superior Derecho) */}
      <div className="absolute bottom-[-80px] left-[-80px] lg:bottom-[-100px] lg:left-[-60px] w-80 sm:w-96 lg:w-[480px] h-80 sm:h-96 lg:h-[480px] rounded-full bg-gradient-to-tr from-teal-400/20 via-sky-400/15 to-transparent blur-3xl pointer-events-none" />

      {/* Estilos para animación de sacudida en error de PIN */}
      <style>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .pin-shake {
          animation: pinShake 0.4s ease-in-out;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          LATERAL IZQUIERDO (DESKTOP)
      ══════════════════════════════════════════════════════════════ */}
      <section className="hidden lg:flex lg:w-1/2 lg:h-full flex-col justify-between p-12 lg:p-14 xl:p-16 relative z-10 select-none">
        <div />

        {/* Bloque Central de Marca Desktop */}
        <div className="flex flex-col items-center justify-center my-auto">
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 lg:w-32 lg:h-32 shrink-0">
              <img
                src={logoImg}
                alt="Logo M&V Dental"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-4xl lg:text-[44px] font-bold text-slate-900 tracking-tight leading-none m-0">
                M&amp;V Turnos
              </h1>
              <p className="text-lg lg:text-xl font-medium text-slate-600 mt-2 tracking-tight">
                Gestión de Turnos
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-500 font-normal tracking-wide mt-6 text-center">
            Sistema Odontológico Integral
          </p>
        </div>

        <footer className="text-center text-xs text-slate-400 font-normal">
          Desarrollado para M&amp;V Dental
        </footer>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          LATERAL DERECHO / CONTENIDO MÓVIL INTEGRADO
      ══════════════════════════════════════════════════════════════ */}
      <section className="w-full lg:w-1/2 flex-1 lg:h-full flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 xl:p-12 relative z-10 overflow-hidden">
        {/* Cabecera integrada exclusiva para móvil (< lg) agrupada directamente sobre la tarjeta */}
        <div className="lg:hidden w-full max-w-sm sm:max-w-md flex flex-col items-center text-center select-none mb-3 sm:mb-4">
          <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 mb-2">
            <img
              src={logoImg}
              alt="Logo M&V Dental"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0">
            M&amp;V Turnos
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-slate-600 mt-0.5">
            Gestión de Turnos
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Sistema Odontológico Integral
          </p>
        </div>

        <main className="bg-white max-w-sm sm:max-w-md w-full p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all text-left">
          {/* ──────────────────────────────────────────────────────────
              VISTA B: CAPA DIARIA (PIN DE ACCESO + FACE ID)
          ────────────────────────────────────────────────────────── */}
          {vista === "pin" && (
            <div className="animate-in fade-in zoom-in-95 duration-200 text-center">
              <header className="mb-6 text-left">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">
                  PIN de Acceso
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Ingresá tu PIN de 4 dígitos para ingresar
                </p>
              </header>

              {/* Contenedor de Casillas de PIN con Input Oculto */}
              <div
                className={`relative w-[240px] mx-auto ${
                  isShaking ? "pin-shake" : ""
                } ${
                  bloqueado
                    ? "opacity-40 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
                onClick={() => {
                  if (!bloqueado && !isValidatingPin && pinInputRef.current) {
                    setErrorPin("");
                    setMensajeExitoPin("");
                    pinInputRef.current.focus();
                  }
                }}
              >
                <input
                  ref={pinInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={handlePinChange}
                  onKeyDown={() => {
                    setErrorPin("");
                    setMensajeExitoPin("");
                  }}
                  autoComplete="one-time-code"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  disabled={bloqueado || isValidatingPin}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer text-[24px] z-[2] disabled:cursor-not-allowed disabled:pointer-events-none"
                  autoFocus
                />

                <div
                  className={`flex justify-between pointer-events-none ${
                    bloqueado || isValidatingPin
                      ? "opacity-40 cursor-not-allowed bg-gray-100 pointer-events-none"
                      : ""
                  }`}
                  aria-hidden="true"
                >
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = index < pin.length;
                    const isActive =
                      index === pin.length &&
                      !bloqueado &&
                      !isValidatingPin;
                    return (
                      <div
                        key={index}
                        className={`w-[50px] h-[50px] border-2 rounded-[12px] flex items-center justify-center transition-all duration-150 ease-out bg-white ${
                          isFilled
                            ? "before:content-[''] before:block before:w-[12px] before:h-[12px] before:bg-[#0f172a] before:rounded-full"
                            : ""
                        } ${
                          isActive
                            ? "border-[#0d9488] shadow-[0_0_0_3px_rgba(13,148,136,0.18)]"
                            : "border-[#cbd5e1]"
                        } ${
                          bloqueado
                            ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Botón Face ID: Exclusivo para vista móvil (< 768px) */}
              {isMobileView && (
                <div className="w-full md:hidden mt-5">
                  <button
                    type="button"
                    onClick={handleFaceIdLogin}
                    disabled={bloqueado || isScanningFaceId || isValidatingPin}
                    className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      faceIdSuccess
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : isScanningFaceId
                        ? "bg-teal-50 border-teal-300 text-teal-800 animate-pulse"
                        : bloqueado
                        ? "bg-gray-100 border-gray-200 text-gray-400 opacity-40 cursor-not-allowed pointer-events-none"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 active:scale-98"
                    } disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none`}
                  >
                    {faceIdSuccess ? (
                      <>
                        <CheckCircle2
                          size={18}
                          className="text-emerald-600 animate-in zoom-in"
                        />
                        <span>Face ID Verificado</span>
                      </>
                    ) : isScanningFaceId ? (
                      <>
                        <ScanFace size={18} className="text-teal-600 animate-pulse" />
                        <span>Escaneando Face ID...</span>
                      </>
                    ) : (
                      <>
                        <ScanFace size={18} className="text-teal-600" />
                        <span>Ingresar con Face ID</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {isValidatingPin && (
                <div className="flex items-center justify-center gap-2 mt-4 text-xs font-medium text-teal-700">
                  <Loader2 size={15} className="animate-spin text-teal-600" />
                  <span>Verificando PIN...</span>
                </div>
              )}

              {/* Alerta de Cooldown tras 3 Fallos */}
              {bloqueado ? (
                <div className="mt-5 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 flex flex-col items-center text-center gap-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <Clock
                      size={16}
                      className="text-rose-600 animate-pulse shrink-0"
                    />
                    <span>Acceso por PIN bloqueado por seguridad</span>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">
                    Has superado los 3 intentos permitidos. El acceso por PIN ha sido bloqueado por 15 minutos.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-rose-200 rounded-full text-xs font-mono font-semibold text-rose-800">
                    <span>Tiempo restante:</span>
                    <span>{formatearTiempo(segundosBloqueo)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleIrAContraseña(
                        "El acceso por PIN ha sido bloqueado por 15 minutos. Ingresá tu correo y contraseña para acceder.",
                      )
                    }
                    className="mt-2 w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer"
                  >
                    Ingresar con contraseña
                  </button>
                </div>
              ) : (
                <>
                  {errorPin && (
                    <div className="flex items-center justify-center gap-1.5 mt-4 text-xs font-medium text-rose-600 animate-in fade-in">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{errorPin}</span>
                    </div>
                  )}
                  {mensajeExitoPin && (
                    <div className="flex items-center justify-center gap-1.5 mt-4 text-xs font-medium text-emerald-600 animate-in fade-in">
                      <CheckCircle2 size={14} className="shrink-0" />
                      <span>{mensajeExitoPin}</span>
                    </div>
                  )}

                  {/* Enlace para volver al ingreso completo con Email y Contraseña (cerrando sesión) */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleIrAContraseña()}
                      className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <span>¿Olvidaste tu PIN? </span>
                      <span className="text-teal-700 hover:text-teal-900 font-semibold underline underline-offset-2">
                        Ingresar con contraseña
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              VISTA A: INICIAR SESIÓN (CON CORREO Y CONTRASEÑA)
          ────────────────────────────────────────────────────────── */}
          {vista === "login" && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">
                  Iniciar Sesión
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Ingresá tu correo y contraseña para acceder al sistema
                </p>
              </header>

              {mensajeExito && (
                <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in">
                  <CheckCircle2
                    size={16}
                    className="shrink-0 mt-0.5 text-emerald-600"
                  />
                  <span>{mensajeExito}</span>
                </div>
              )}

              {alertaSeguridad && (
                <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium animate-in fade-in">
                  <ShieldAlert
                    size={16}
                    className="shrink-0 mt-0.5 text-amber-600"
                  />
                  <span>{alertaSeguridad}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Campo Correo Electrónico (Email) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Correo electrónico
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      disabled={cargando}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="admin@consultorio.com"
                      autoComplete="username"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all disabled:opacity-60"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Contraseña
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      disabled={cargando}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Ingresá tu contraseña"
                      autoComplete="current-password"
                      required
                      className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={cargando}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer disabled:opacity-50"
                      title={showPassword ? "Ocultar" : "Mostrar"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Mensaje de Error */}
                {error && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Botón Principal Ingresar */}
                <button
                  type="submit"
                  disabled={cargando || !password.trim() || !email.trim()}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e6f85] hover:bg-[#18586a] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                >
                  {cargando ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Iniciando sesión...</span>
                    </div>
                  ) : (
                    <span>Ingresar</span>
                  )}
                </button>
              </form>

              {/* Enlace a Recuperación de Contraseña por Correo */}
              <div className="mt-6 text-center text-xs text-slate-600">
                <span>¿Olvidaste tu contraseña? </span>
                <button
                  type="button"
                  onClick={handleIrARecuperarEmail}
                  className="text-teal-700 hover:text-teal-800 font-semibold underline underline-offset-2 cursor-pointer transition-colors"
                >
                  Recuperar por correo
                </button>
              </div>

              {/* Botón para volver a ingresar con PIN si hay credenciales previas */}
              {tieneSesionPrevia && !bloqueado && (
                <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={handleVolverAPin}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Volver a ingresar con PIN</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              VISTA C: RECUPERACIÓN DE CONTRASEÑA POR CORREO
          ────────────────────────────────────────────────────────── */}
          {vista === "recuperar_password" && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">
                  Recuperar Contraseña
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Ingresá tu correo registrado para recibir las instrucciones y el código de recuperación.
                </p>
              </header>

              {passwordRestablecida ? (
                <div className="py-6 flex flex-col items-center text-center gap-4 animate-in fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={30} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      ¡Contraseña Restablecida!
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                      Tu clave de acceso ha sido actualizada con éxito. Ya podés iniciar sesión con tus nuevas credenciales.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleVolverAIniciarSesion();
                      setMensajeExito(
                        "Contraseña actualizada exitosamente. Inicie sesión con sus nuevas credenciales.",
                      );
                    }}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e6f85] hover:bg-[#18586a] active:scale-98 transition-all shadow-sm cursor-pointer"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              ) : emailEnviado ? (
                <form
                  onSubmit={handleRestablecerPasswordSubmit}
                  className="space-y-4"
                >
                  {mensajeExito && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                      {mensajeExito}
                    </div>
                  )}

                  {/* Campo Código de 6 dígitos */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Código de 6 dígitos recibido
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={codigoRecuperacion}
                      onChange={(e) => {
                        setCodigoRecuperacion(
                          e.target.value.replace(/\D/g, ""),
                        );
                        setErrorRestablecer("");
                      }}
                      placeholder="123456"
                      required
                      className="w-full tracking-widest text-center text-lg font-bold py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all"
                      autoFocus
                    />
                  </div>

                  {/* Nueva Contraseña */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nueva Contraseña
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showNuevaPassword ? "text" : "password"}
                        value={nuevaPassword}
                        disabled={cargandoRestablecer}
                        onChange={(e) => {
                          setNuevaPassword(e.target.value);
                          setErrorRestablecer("");
                        }}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all disabled:opacity-60"
                      />
                      <button
                        type="button"
                        disabled={cargandoRestablecer}
                        onClick={() =>
                          setShowNuevaPassword(!showNuevaPassword)
                        }
                        className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer disabled:opacity-50"
                      >
                        {showNuevaPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nueva Contraseña */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showNuevaPassword ? "text" : "password"}
                        value={confirmarPassword}
                        disabled={cargandoRestablecer}
                        onChange={(e) => {
                          setConfirmarPassword(e.target.value);
                          setErrorRestablecer("");
                        }}
                        placeholder="Repetí la contraseña"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {errorRestablecer && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{errorRestablecer}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      cargandoRestablecer ||
                      codigoRecuperacion.length !== 6 ||
                      !nuevaPassword ||
                      !confirmarPassword
                    }
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e6f85] hover:bg-[#18586a] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                  >
                    {cargandoRestablecer ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2
                          size={16}
                          className="animate-spin text-white"
                        />
                        <span>Restableciendo...</span>
                      </div>
                    ) : (
                      <span>Restablecer contraseña</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmailEnviado(false);
                      setCodigoRecuperacion("");
                      setNuevaPassword("");
                      setConfirmarPassword("");
                      setErrorRestablecer("");
                      setErrorEmail("");
                      setMensajeExito("");
                    }}
                    disabled={cargandoRestablecer}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold mt-2 cursor-pointer transition-colors"
                  >
                    ← Volver o reenviar correo
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleRecuperarPassword}
                  autoComplete="off"
                  className="space-y-4"
                >
                  {/* Campo Email en Recuperación */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Correo electrónico registrado
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        disabled={
                          cargandoEmail || segundosBloqueoRecuperacion > 0
                        }
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorEmail("");
                        }}
                        placeholder="admin@consultorio.com"
                        autoComplete="email"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all disabled:opacity-60"
                        autoFocus
                      />
                    </div>
                  </div>

                  {errorEmail && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{errorEmail}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      cargandoEmail ||
                      segundosBloqueoRecuperacion > 0 ||
                      !email.trim()
                    }
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e6f85] hover:bg-[#18586a] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                  >
                    {cargandoEmail ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2
                          size={16}
                          className="animate-spin text-white"
                        />
                        <span>Enviando...</span>
                      </div>
                    ) : segundosBloqueoRecuperacion > 0 ? (
                      <span>
                        Reintentar en{" "}
                        {formatearTiempo(segundosBloqueoRecuperacion)}
                      </span>
                    ) : (
                      <span>Enviar instrucciones</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleVolverAIniciarSesion}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold mt-3 cursor-pointer transition-colors"
                  >
                    Volver a Iniciar Sesión
                  </button>
                </form>
              )}
            </div>
          )}
        </main>
      </section>

      {/* Pie móvil discreto */}
      <footer className="lg:hidden shrink-0 pb-3 pt-1 text-center text-[10px] text-slate-400 relative z-10 select-none">
        Desarrollado para M&amp;V Dental
      </footer>
    </div>
  );
}

export default Login;
