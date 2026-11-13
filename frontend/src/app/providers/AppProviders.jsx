/** @format */

import { AuthProvider } from "@/features/auth";
import { ConfiguracionProvider } from "@/features/configuracion";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { SidebarProvider } from "@/shared/context/SidebarProvider";

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ConfiguracionProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ConfiguracionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default AppProviders;

