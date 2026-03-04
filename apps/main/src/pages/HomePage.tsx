import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@bethel/shared-auth';
import { TrendingUp, ArrowRight } from 'lucide-react';

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  status: 'active' | 'coming_soon';
}

const serviceCards: ServiceCard[] = [
  {
    id: 'monetizacao',
    title: 'Monetização',
    description: 'Dashboard de vendas, métricas de performance, closers, SDRs, squads e relatórios de funil.',
    icon: TrendingUp,
    path: '/monetizacao',
    color: 'from-blue-600 to-indigo-600',
    status: 'active',
  },
  // Future services:
  // {
  //   id: 'crm',
  //   title: 'CRM',
  //   description: 'Gestão de relacionamento com clientes e pipeline de vendas.',
  //   icon: Users,
  //   path: '/crm',
  //   color: 'from-emerald-600 to-teal-600',
  //   status: 'coming_soon',
  // },
];

export function HomePage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Bem-vindo à Bethel Platform
        </h1>
        <p className="text-muted-foreground mt-1">
          Acesse os serviços disponíveis abaixo.
        </p>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceCards.map((service) => {
          const Icon = service.icon;
          const isActive = service.status === 'active';
          return (
            <button
              key={service.id}
              onClick={() => isActive && navigate(service.path)}
              disabled={!isActive}
              className={`
                relative p-6 rounded-xl border border-border bg-card text-left
                transition-all group
                ${isActive
                  ? 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
                }
              `}
            >
              <div className={`
                w-12 h-12 rounded-xl bg-gradient-to-br ${service.color}
                flex items-center justify-center mb-4
              `}>
                <Icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="font-semibold text-foreground text-lg mb-1">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.description}
              </p>

              {isActive ? (
                <div className="mt-4 flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
                  <span>Acessar</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              ) : (
                <div className="mt-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    Em breve
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick info */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Logado como:</strong>{' '}
          {user?.email} ({role ?? 'carregando...'})
        </p>
      </div>
    </div>
  );
}
