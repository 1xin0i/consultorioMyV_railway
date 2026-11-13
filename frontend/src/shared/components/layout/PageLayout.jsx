/** @format */

import Header from "@/shared/components/ui/Header";

export function PageLayout({
  icono,
  titulo,
  subtitulo,
  accionesHeader,
  children,
}) {
  return (
    <div className="min-h-full bg-[#e6f3ef] dark:bg-slate-950 p-3 sm:p-6 md:p-8 flex justify-center transition-colors">
      <div className="w-full max-w-7xl flex flex-col">
        <Header icono={icono} titulo={titulo} subtitulo={subtitulo}>
          {accionesHeader}
        </Header>

        <div className="flex flex-col flex-1">{children}</div>
      </div>
    </div>
  );
}

export default PageLayout;

