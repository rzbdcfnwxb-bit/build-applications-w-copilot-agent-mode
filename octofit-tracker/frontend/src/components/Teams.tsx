import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadTeams = () => getJson<Record<string, unknown>>('/api/teams');

export default function Teams() {
  return <CapabilityCard title="Teams" description="Manage teams and members." load={loadTeams} dataKey="teams" emptyMessage="No teams yet." />;
}
