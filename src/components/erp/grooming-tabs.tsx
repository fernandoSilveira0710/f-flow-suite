import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, PlusCircle, PawPrint, Users, Briefcase, Box, UserCog } from 'lucide-react';

const tabs = [
  { value: 'kanban', label: 'Kanban', icon: LayoutGrid, href: '/erp/grooming' },
  { value: 'checkin', label: 'Check-in', icon: PlusCircle, href: '/erp/grooming/new' },
  { value: 'pets', label: 'Pets', icon: PawPrint, href: '/erp/grooming/pets' },
  { value: 'tutors', label: 'Tutores', icon: Users, href: '/erp/grooming/tutors' },
  { value: 'services', label: 'Serviços', icon: Briefcase, href: '/erp/grooming/services' },
  { value: 'resources', label: 'Recursos', icon: Box, href: '/erp/grooming/resources' },
  { value: 'profissionais', label: 'Profissionais', icon: UserCog, href: '/erp/grooming/profissionais' },
];

export function GroomingTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentTab = tabs.find(tab => {
    if (tab.href === '/erp/grooming') {
      return location.pathname === '/erp/grooming';
    }
    return location.pathname.startsWith(tab.href);
  })?.value || 'kanban';

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="w-full justify-start">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            onClick={() => navigate(tab.href)}
            className="gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
