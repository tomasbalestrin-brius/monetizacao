import { useState, useMemo } from 'react';
import { LogOut, Loader2, TrendingUp, LinkIcon } from 'lucide-react';
import { useAuth } from '@bethel/shared-auth';
import { useCurrentUserEntityLinks } from '@/hooks/useUserEntityLinks';
import { useClosers } from '@/hooks/useMetrics';
import { CloserDetailPage } from '@/components/dashboard/closer/CloserDetailPage';
import { SDRDetailPage } from '@/components/dashboard/sdr/SDRDetailPage';
import { Button } from '@/components/ui/button';

export function UserDashboard() {
  const { signOut, user } = useAuth();
  const { data: links, isLoading: isLoadingLinks } = useCurrentUserEntityLinks();
  const { data: closers, isLoading: isLoadingClosers } = useClosers();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const primaryLink = useMemo(() => links?.[0] ?? null, [links]);

  // Find squad slug for closer entity
  const closerSquadSlug = useMemo(() => {
    if (!primaryLink || primaryLink.entity_type !== 'closer' || !closers) return '';
    const closer = closers.find(c => c.id === primaryLink.entity_id);
    return (closer as any)?.squad?.slug || '';
  }, [primaryLink, closers]);

  const isLoading = isLoadingLinks || (primaryLink?.entity_type === 'closer' && isLoadingClosers);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  if (!primaryLink) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-primary" />
            </div>
            <span className="font-semibold text-foreground">Monetização</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-destructive">
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </header>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <LinkIcon size={24} className="text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Aguardando Vínculo</h2>
            <p className="text-muted-foreground">
              Sua conta ainda não está vinculada a nenhum canal. Entre em contato com o administrador para configurar seu acesso.
            </p>
            <p className="text-xs text-muted-foreground mt-4">{user?.email}</p>
          </div>
        </div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-primary" />
          </div>
          <span className="font-semibold text-foreground">Monetização</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-destructive">
          <LogOut size={16} className="mr-2" />
          Sair
        </Button>
      </header>

      <main className="p-4 md:p-6 lg:p-8">
        {primaryLink.entity_type === 'closer' ? (
          <CloserDetailPage
            closerId={primaryLink.entity_id}
            squadSlug={closerSquadSlug}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        ) : (
          <SDRDetailPage
            sdrId={primaryLink.entity_id}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        )}
      </main>
    </div>
  );
}
