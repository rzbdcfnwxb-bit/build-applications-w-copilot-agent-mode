import { CapabilityCard } from './CapabilityCard.js';
export default function Activities() {
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." endpoint="/api/activities" dataKey="activities" emptyMessage="No activities yet." />;
}
