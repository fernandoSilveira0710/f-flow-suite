import { AgendaTabs } from '@/components/erp/agenda-tabs';
import AgendaCalendar from './index-calendar';

export default function AgendaIndex() {
  return (
    <div className="space-y-6">
      <AgendaTabs />
      <AgendaCalendar />
    </div>
  );
}
