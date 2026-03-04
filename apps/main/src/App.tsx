import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Toaster } from "sonner";
import { createSupabaseClient } from "@bethel/shared-supabase";
import { AuthProvider } from "@bethel/shared-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PlatformLayout } from "@/layouts/PlatformLayout";
import { AuthPage } from "@/pages/AuthPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

// Initialize Supabase client (singleton - must happen before any auth/data usage)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (supabaseUrl && supabaseKey) {
  createSupabaseClient(supabaseUrl, supabaseKey);
}

// Global query client for the platform
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Lazy-load microservice modules
const MonetizacaoModule = React.lazy(
  () => import("@bethel/monetizacao").then((m) => ({ default: m.MonetizacaoRoutes }))
);

// SDR module placeholder - will be replaced when the SDR service is fully ported
const SDRPlaceholder = React.lazy(() => Promise.resolve({
  default: () => (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Bethel SDR</h2>
      <p className="text-muted-foreground max-w-md">
        O modulo de CRM para SDRs esta em desenvolvimento. Em breve voce podera gerenciar leads, qualificacoes e agendamentos aqui.
      </p>
    </div>
  ),
}));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected platform routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PlatformLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />

              {/* Monetização Microservice */}
              <Route
                path="monetizacao/*"
                element={
                  <React.Suspense
                    fallback={
                      <div className="flex items-center justify-center min-h-[40vh]">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    }
                  >
                    <MonetizacaoModule />
                  </React.Suspense>
                }
              />

              {/* Bethel SDR Microservice */}
              <Route
                path="sdr/*"
                element={
                  <React.Suspense
                    fallback={
                      <div className="flex items-center justify-center min-h-[40vh]">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    }
                  >
                    <SDRPlaceholder />
                  </React.Suspense>
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
