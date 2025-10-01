import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { LucideIcon } from 'lucide-react';

interface StubPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function StubPage({ title, description, icon }: StubPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Em desenvolvimento"
        description="Este módulo estará disponível em breve."
      />
    </div>
  );
}
