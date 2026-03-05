/**
 * @bethel/sdr - Micro-frontend Module
 *
 * Bethel SDR - CRM & Gestão de Leads
 * Microserviço separado da monetização.
 *
 * Módulos:
 * - Dashboard (todos os SDRs)
 * - Gestão de Leads / CRM Kanban (todos os SDRs)
 * - Leads / Métricas SDR (todos os SDRs)
 * - Relatórios (todos os SDRs)
 * - Qualificação (líder/admin)
 * - Metas (líder/admin)
 * - Painel Admin (admin)
 */

import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@bethel/shared-auth';
import { Loader2 } from 'lucide-react';

// Lazy-loaded pages
const Index = lazy(() => import('@/pages/Index'));
const Auth = lazy(() => import('@/pages/Auth'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Internal query client for the SDR service
const sdrQueryClient = new QueryClient({
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

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  );
}

/**
 * SDRRoutes - Route definitions for embedding in parent app
 */
export function SDRRoutes() {
  return (
    <AuthProvider>
      <ErrorBoundary section="sdr">
        <Suspense fallback={<ModuleLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AuthProvider>
  );
}

/**
 * SDRModule - Full self-contained module
 */
export function SDRModule() {
  return (
    <QueryClientProvider client={sdrQueryClient}>
      <TooltipProvider>
        <Toaster richColors position="top-right" />
        <SDRRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export { ErrorBoundary } from '@/components/ErrorBoundary';

// Re-export SDR hooks for use by other services
export { useSDRs, useSDRMetrics, useSDRTotalMetrics } from '@/hooks/useSdrMetrics';
export { useLeads, useCrmColumns } from '@/hooks/useLeads';

export default SDRModule;
