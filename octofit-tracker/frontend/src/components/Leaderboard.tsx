import { CapabilityCard } from './CapabilityCard.js';
export default function Leaderboard() {
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." endpoint="/api/leaderboard" dataKey="leaderboard" emptyMessage="No rankings yet." />;
}
