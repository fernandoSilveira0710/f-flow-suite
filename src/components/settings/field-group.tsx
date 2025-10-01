import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

interface FieldGroupProps {
  label: string;
  description?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function FieldGroup({ label, description, children, htmlFor }: FieldGroupProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div>{children}</div>
    </div>
  );
}
