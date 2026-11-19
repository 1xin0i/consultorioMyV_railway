/** @format */

import { AuthProvider, PinLockProvider } from "@/features/auth";
import { ConfiguracionProvider } from "@/features/configuracion";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { SidebarProvider } from "@/shared/context/SidebarProvider";

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <PinLockProvider>
        <ThemeProvider>
          <ConfiguracionProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ConfiguracionProvider>
        </ThemeProvider>
      </PinLockProvider>
    </AuthProvider>
  );
}

export default AppProviders;

