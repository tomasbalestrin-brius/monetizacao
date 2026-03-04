/**
 * @bethel/monetizacao - Micro-frontend Module
 *
 * This file exports the Monetização service as a self-contained module
 * that can be mounted inside the Bethel Platform (sistema mãe).
 *
 * Usage in the main app:
 *   import { MonetizacaoModule, MonetizacaoRoutes } from '@bethel/monetizacao';
 *
 *   // As a full module with its own layout:
 *   <MonetizacaoModule />
 *
 *   // Or just the routes to embed in your own layout:
 *   <MonetizacaoRoutes />
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Lazy-loaded pages
const Index = lazy(() => import('@/pages/Index'));
const Auth = lazy(() => import('@/pages/Auth'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Internal query client for the monetizacao service
const monetizacaoQueryClient = new QueryClient({
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
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * MonetizacaoRoutes - Just the route definitions for embedding
 * Use this when the parent app already provides QueryClient, Toasters, etc.
 */
export function MonetizacaoRoutes() {
  return (
    <AuthProvider>
      <ErrorBoundary section="monetizacao">
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
 * MonetizacaoModule - Full self-contained module
 * Includes its own QueryClient, Toasters, and Tooltip provider.
 * Use this for maximum isolation from the host app.
 */
export function MonetizacaoModule() {
  return (
    <QueryClientProvider client={monetizacaoQueryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <MonetizacaoRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Re-export key components for use by the parent app
export { ErrorBoundary } from '@/components/ErrorBoundary';

// Re-export hooks for use by other services
export { useSquads, useClosers, useMetrics, useTotalMetrics } from '@/hooks/useMetrics';
// SDR hooks removed - SDR is a separate microservice
export { useFunnels } from '@/hooks/useFunnels';
export { useGoals, useAllGoals } from '@/hooks/useGoals';
export { useMeetings } from '@/hooks/useMeetings';

// Re-export utility functions
export {
  getWorkingDaysInMonth,
  getWorkingDaysBetween,
  calculateTrend,
  calculateTrendDetailed,
} from '@/lib/workingDays';

// Default export for simple usage
export default MonetizacaoModule;
