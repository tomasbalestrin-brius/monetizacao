import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, ModuleId } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Lazy load page components
const SDRDashboardOverview = lazy(() => import('@/components/dashboard/SDRDashboardOverview').then(m => ({ default: m.SDRDashboardOverview })));
const CrmKanbanPage = lazy(() => import('@/components/dashboard/crm/CrmKanbanPage').then(m => ({ default: m.CrmKanbanPage })));
const LeadsImportPage = lazy(() => import('@/components/dashboard/LeadsImportPage').then(m => ({ default: m.LeadsImportPage })));
const SDRReportsPage = lazy(() => import('@/components/dashboard/SDRReportsPage').then(m => ({ default: m.SDRReportsPage })));
const SDRQualificationPage = lazy(() => import('@/components/dashboard/SDRQualificationPage').then(m => ({ default: m.SDRQualificationPage })));
const SDRGoalsPage = lazy(() => import('@/components/dashboard/SDRGoalsPage').then(m => ({ default: m.SDRGoalsPage })));
const SDRAdminPanel = lazy(() => import('@/components/dashboard/SDRAdminPanel').then(m => ({ default: m.SDRAdminPanel })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  );
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const { loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');

  // Handle URL module parameter
  useEffect(() => {
    const moduleParam = searchParams.get('module');
    if (moduleParam && ['dashboard', 'leads', 'lead-management', 'reports', 'qualification', 'goals', 'admin'].includes(moduleParam)) {
      setActiveModule(moduleParam as ModuleId);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <SDRDashboardOverview />;
      case 'lead-management':
        return <CrmKanbanPage />;
      case 'leads':
        return <LeadsImportPage />;
      case 'reports':
        return <SDRReportsPage />;
      case 'qualification':
        return <SDRQualificationPage />;
      case 'goals':
        return <SDRGoalsPage />;
      case 'admin':
        return <SDRAdminPanel />;
      default:
        return <SDRDashboardOverview />;
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
