import { Link } from 'react-router-dom';
import { ENDPOINTS } from '@/lib/env';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Zap } from 'lucide-react';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  requiredPlan: string;
}

export function UpgradeDialog({
  open,
  onOpenChange,
  feature,
  requiredPlan,
}: UpgradeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <AlertDialogTitle>Recurso Bloqueado</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            O recurso <strong>{feature}</strong> está disponível apenas no plano{' '}
            <strong>{requiredPlan}</strong>. Faça upgrade para desbloquear esta funcionalidade.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <a href={ENDPOINTS.SITE_RENOVACAO} target="_blank" rel="noopener noreferrer">Ver Planos</a>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
