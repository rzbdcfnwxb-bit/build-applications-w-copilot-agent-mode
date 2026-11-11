import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadLeaderboard = () => getJson<Record<string, unknown>>('/api/leaderboard');

export default function Leaderboard() {
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." load={loadLeaderboard} dataKey="leaderboard" emptyMessage="No rankings yet." />;
}
