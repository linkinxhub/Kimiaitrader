import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/App";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ToastProvider } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ToastContainer";
import { TRPCProvider } from "@/providers/TRPCProvider";
import "@/styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TRPCProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
            <ToastContainer />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </TRPCProvider>
  </React.StrictMode>,
);
