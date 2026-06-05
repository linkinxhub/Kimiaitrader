import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";

export function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 p-8 text-slate-200">Chargement de XTrendAI Pro...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
