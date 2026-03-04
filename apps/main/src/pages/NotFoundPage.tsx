import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-foreground mb-2">Página não encontrada</p>
        <p className="text-muted-foreground mb-6">
          A página que você procura não existe ou foi movida.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
