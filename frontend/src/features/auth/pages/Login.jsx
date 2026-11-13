/** @format */

import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { manejarErrorApi } from "@/shared/utils/errorHandler";
import { ToothLogo } from "@/shared/components/layout/ToothLogo";
import { RecuperarPasswordModal } from "../components/RecuperarPasswordModal";

export function Login() {
  const { login, estaAutenticado } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [modalRecuperarAbierto, setModalRecuperarAbierto] = useState(false);

  const destino = location.state?.from?.pathname || "/";

  if (estaAutenticado) {
    return <Navigate to={destino} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Completá tu correo y contraseña para ingresar.");
      return;
    }

    setEnviando(true);
    try {
      const usuario = await login(email.trim(), password);
      toast.success(`¡Bienvenido/a, ${usuario.nombre}!`);
      navigate(destino, { replace: true });
    } catch (error) {
      manejarErrorApi(error, "Credenciales inválidas. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f4f7f9]">
      {/* Panel izquierdo institucional (visible en desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0d1f33] via-[#102942] to-[#133852] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#2eb086]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#2eb086]/15 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <ToothLogo size={46} />
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Consultorio M&amp;V
            </h1>
            <p className="text-xs font-medium text-[#3dd4a3]">
              Sistema Integral de Gestión Odontológica
            </p>
          </div>
        </div>

        <div className="space-y-5 max-w-md relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#2eb086]/20 text-[#3dd4a3] border border-[#2eb086]/30">
            Acceso Profesional Seguro
          </span>
          <h2 className="text-3xl font-bold leading-snug tracking-tight">
            Administrá tu agenda, pacientes y caja clínica en un solo lugar.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Plataforma diseñada para agilizar la atención diaria del consultorio,
            el seguimiento de obras sociales y el control financiero.
          </p>
        </div>

        <p className="text-xs text-slate-400 relative z-10">
          © {new Date().getFullYear()} Consultorio Odontológico M&amp;V · Todos
          los derechos reservados
        </p>
      </div>

      {/* Panel derecho: formulario de login */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 md:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-6 sm:p-8">
          {/* Header móvil con logo */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="mb-3">
              <ToothLogo size={54} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Ingresá tus credenciales para acceder al consultorio
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Mail size={17} />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@consultoriomyv.com"
                  disabled={enviando}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setModalRecuperarAbierto(true)}
                  className="text-xs font-semibold text-[#0d8266] hover:text-[#2eb086] hover:underline cursor-pointer transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock size={17} />
                </span>
                <input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={enviando}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMostrarPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {mostrarPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#2eb086] hover:bg-[#259670] active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-[#2eb086]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {enviando ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al sistema</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <RecuperarPasswordModal
        isOpen={modalRecuperarAbierto}
        onClose={() => setModalRecuperarAbierto(false)}
        emailInicial={email}
      />
    </div>
  );
}

export default Login;

