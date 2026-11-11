import { CapabilityCard } from './CapabilityCard.js';
export default function Workouts() {
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." endpoint={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`} dataKey="suggestions" emptyMessage="No workout suggestions yet." />;
}
