import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@bethel/shared-auth';
import { Sidebar, ModuleId } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// P2: Lazy load heavy page components
const DashboardOverview = lazy(() => import('@/components/dashboard/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const SquadPage = lazy(() => import('@/components/dashboard/SquadPage').then(m => ({ default: m.SquadPage })));
const AdminPanel = lazy(() => import('@/components/dashboard/AdminPanel').then(m => ({ default: m.AdminPanel })));
const GoalsConfig = lazy(() => import('@/components/dashboard/GoalsConfig').then(m => ({ default: m.GoalsConfig })));
const MeetingsPage = lazy(() => import('@/components/dashboard/meetings').then(m => ({ default: m.MeetingsPage })));
const ReportsPage = lazy(() => import('@/components/dashboard/reports').then(m => ({ default: m.ReportsPage })));
const AgendaPage = lazy(() => import('@/components/dashboard/agenda/AgendaPage').then(m => ({ default: m.AgendaPage })));
const AvailabilityPage = lazy(() => import('@/components/dashboard/availability/AvailabilityPage').then(m => ({ default: m.AvailabilityPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const { loading, isCloser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Closers default to 'agenda', everyone else to 'dashboard'
  const [activeModule, setActiveModule] = useState<ModuleId>(isCloser ? 'agenda' : 'dashboard');

  // Handle URL module parameter
  useEffect(() => {
    const moduleParam = searchParams.get('module');
    if (moduleParam && ['dashboard', 'agenda', 'eagles', 'sharks', 'reports', 'admin', 'goals', 'meetings', 'availability'].includes(moduleParam)) {
      setActiveModule(moduleParam as ModuleId);
    }
  }, [searchParams]);

  // Set default module when role loads
  useEffect(() => {
    if (isCloser && activeModule === 'dashboard') {
      setActiveModule('agenda');
    }
  }, [isCloser]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'agenda':
        return <AgendaPage />;
      case 'eagles':
        return <SquadPage squadSlug="eagles" />;
      case 'sharks':
        return <SquadPage squadSlug="sharks" />;
      case 'admin':
        return <AdminPanel />;
      case 'goals':
        return <GoalsConfig />;
      case 'meetings':
        return <MeetingsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'availability':
        return <AvailabilityPage />;
      default:
        return isCloser ? <AgendaPage /> : <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />
      
      <div className="md:pl-64 min-h-screen flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <ErrorBoundary section={activeModule} key={activeModule}>
            <Suspense fallback={<PageLoader />}>
              {renderContent()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />
    </div>
  );
};

export default Index;
