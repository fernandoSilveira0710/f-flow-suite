import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Briefcase, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { value: 'calendario', label: 'Calendário', icon: Calendar, href: '/erp/agenda' },
  { value: 'clientes', label: 'Clientes', icon: Users, href: '/erp/agenda/clientes' },
  { value: 'servicos', label: 'Serviços', icon: Briefcase, href: '/erp/agenda/servicos' },
  { value: 'profissionais', label: 'Profissionais', icon: Users, href: '/erp/agenda/profissionais' },
];

export function AgendaTabs() {
  const location = useLocation();
  
  const currentTab = tabs.find(tab => {
    if (tab.href === '/erp/agenda') {
      return location.pathname === '/erp/agenda';
    }
    return location.pathname.startsWith(tab.href);
  })?.value || 'calendario';

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="w-full justify-start">
        {tabs.map((tab) => (
          <Link key={tab.value} to={tab.href}>
            <TabsTrigger
              value={tab.value}
              className={cn(
                "gap-2",
                currentTab === tab.value && "data-[state=active]:bg-background"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          </Link>
        ))}
      </TabsList>
    </Tabs>
  );
}
