import { CapabilityCard } from './CapabilityCard.js';
export default function Teams() {
  return <CapabilityCard title="Teams" description="Manage teams and members." endpoint="/api/teams" dataKey="teams" emptyMessage="No teams yet." />;
}
