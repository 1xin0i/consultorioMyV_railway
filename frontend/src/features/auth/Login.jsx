/** @format */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import RecuperarPasswordModal from "./components/RecuperarPasswordModal";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const usuarioGuardado = localStorage.getItem("usuario_recordado") || "";

  const [usuario, setUsuario] = useState(usuarioGuardado);
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(Boolean(usuarioGuardado));
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [mostrarModalRecuperar, setMostrarModalRecuperar] = useState(false);

  // Redirigir a inicio si el usuario ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const destino = location.state?.from?.pathname || "/";
      navigate(destino, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;
    setError("");
    setMensajeExito("");

    const usuarioLimpio = usuario.trim();
    if (!usuarioLimpio) {
      setError("Por favor, ingresá tu nombre de usuario o correo.");
      return;
    }

    if (!password) {
      setError("Por favor, ingresá la contraseña de tu cuenta.");
      return;
    }

    setCargando(true);

    try {
      await login(usuarioLimpio, password);

      if (recordar) {
        localStorage.setItem("usuario_recordado", usuarioLimpio);
      } else {
        localStorage.removeItem("usuario_recordado");
      }

      onLoginSuccess?.();

      const destino = location.state?.from?.pathname || "/";
      navigate(destino, { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Credenciales inválidas. Verificá tu usuario y contraseña.";
      setError(errorMsg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0b131e] p-4 box-border select-none transition-colors">
      <main className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-8 text-center text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera institucional */}
        <header className="flex flex-col items-center">
          <div className="w-20 h-20 mb-3 inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-2xs">
            <img
              src={logoImg}
              alt="M&V Odontología"
              className="w-full h-full object-contain block"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0">
            M&V Odontología
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Gestión de Turnos y Consultorio
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-emerald-950/60 border border-teal-200/80 dark:border-emerald-800/60 text-teal-800 dark:text-emerald-300 text-[11px] font-semibold">
            <ShieldCheck size={14} className="text-[#2eb086]" />
            <span>Acceso Seguro</span>
          </div>
        </header>

        {/* Notificación de Éxito tras Restablecimiento */}
        {mensajeExito && (
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium text-left animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          {/* Campo Usuario o Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Usuario o Correo
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 dark:text-slate-500">
                <User size={16} />
              </span>
              <input
                type="text"
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value);
                  setError("");
                  setMensajeExito("");
                }}
                disabled={cargando}
                placeholder="Ingresá tu usuario o correo"
                autoComplete="username"
                className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base md:text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all ${
                  cargando ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50" : ""
                }`}
                autoFocus={!usuarioGuardado}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Contraseña
              </label>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 dark:text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                disabled={cargando}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                  setMensajeExito("");
                }}
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                className={`w-full pl-10 pr-11 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base md:text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all ${
                  cargando ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50" : ""
                }`}
                autoFocus={Boolean(usuarioGuardado)}
              />
              <button
                type="button"
                disabled={cargando}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer disabled:opacity-50"
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Checkbox Recordar Usuario */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
                className="w-4 h-4 rounded text-[#2eb086] focus:ring-[#2eb086] border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Recordar usuario
              </span>
            </label>

            <button
              type="button"
              onClick={() => setMostrarModalRecuperar(true)}
              className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors cursor-pointer"
            >
              ¿Olvidaste tu clave?
            </button>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={cargando || !password || !usuario.trim()}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#205e74] to-[#2eb086] hover:opacity-95 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-teal-700/10 cursor-pointer"
          >
            {cargando ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-white" />
                <span>Iniciando sesión...</span>
              </div>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </main>

      {/* Modal de Recuperación de Contraseña */}
      {mostrarModalRecuperar && (
        <RecuperarPasswordModal
          isOpen={mostrarModalRecuperar}
          onClose={() => {
            setMensajeExito("");
            setError("");
            setMostrarModalRecuperar(false);
          }}
          onSuccess={(msg) => {
            setMensajeExito(msg);
            setError("");
            setMostrarModalRecuperar(false);
          }}
        />
      )}
    </div>
  );
}

export const LoginMaestro = Login;

