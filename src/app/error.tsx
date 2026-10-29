'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20 shadow-sm">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Ocurrió un error inesperado</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        No se pudo completar la carga del módulo. Esto puede deberse a un problema de sincronización temporal o de sesión.
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} variant="default" className="gradient-brand text-white shadow-glow-brand">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <Home className="w-4 h-4 mr-2" />
            Ir al Dashboard
          </Link>
        </Button>
      </div>
      {error?.message && (
        <pre className="mt-6 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground max-w-lg text-left overflow-x-auto border border-border">
          {error.message}
        </pre>
      )}
    </div>
  );
}
