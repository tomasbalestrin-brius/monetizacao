import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Toaster } from "sonner";
import { createSupabaseClient } from "@bethel/shared-supabase";
import { AuthProvider } from "@bethel/shared-auth";
import { ThemeProvider } from "@bethel/shared-theme";
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

const SDRModule = React.lazy(
  () => import("@bethel/sdr").then((m) => ({ default: m.SDRRoutes }))
);

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster richColors position="top-right" />
          <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Platform home - with platform layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PlatformLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
            </Route>

            {/* Monetização Microservice - own layout, no platform shell */}
            <Route
              path="/monetizacao"
              element={
                <ProtectedRoute>
                  <React.Suspense
                    fallback={
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    }
                  >
                    <MonetizacaoModule />
                  </React.Suspense>
                </ProtectedRoute>
              }
            />

            {/* Bethel SDR Microservice - own layout, no platform shell */}
            <Route
              path="/sdr"
              element={
                <ProtectedRoute>
                  <React.Suspense
                    fallback={
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    }
                  >
                    <SDRModule />
                  </React.Suspense>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
