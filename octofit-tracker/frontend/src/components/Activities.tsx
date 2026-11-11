import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadActivities = () => getJson<Record<string, unknown>>('/api/activities');

export default function Activities() {
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." load={loadActivities} dataKey="activities" emptyMessage="No activities yet." />;
}
