import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function objectIdString(value: unknown): string {
  if (typeof value === 'string') return value;
  return value instanceof mongoose.Types.ObjectId ? value.toHexString() : '';
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    const error = new Error('Activity payload is required');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const payload = input as Record<string, unknown>;
  const userId = objectIdString(typeof payload.userId === 'string' ? payload.userId : payload.user);
  const teamId = objectIdString(typeof payload.teamId === 'string' ? payload.teamId : payload.team);
  const type = typeof payload.type === 'string' ? payload.type.trim() : '';
  const minutesValue = payload.minutes;
  const minutes = typeof minutesValue === 'number' ? minutesValue : Number(minutesValue);

  if (!userId || !teamId || !type || !Number.isFinite(minutes) || minutes <= 0) {
    const error = new Error('Activity requires a valid userId, teamId, type, and positive minutes');
    Object.assign(error, { status: 400 });
    throw error;
  }

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    const error = new Error('Activity userId and teamId must be valid MongoDB ObjectIds');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);

  if (!user || !team) {
    const error = new Error('Activity references a user and team that do not exist');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const points = Math.max(1, Math.round(minutes));
  const created = await Activity.create({
    user: new mongoose.Types.ObjectId(userId),
    team: new mongoose.Types.ObjectId(teamId),
    type,
    minutes,
    points,
    occurredAt: payload.occurredAt ? new Date(payload.occurredAt as string | number | Date) : new Date(),
  });

  return created.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    const error = new Error('Team payload is required');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const payload = input as Record<string, unknown>;
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const mascot = typeof payload.mascot === 'string' ? payload.mascot.trim() : '';
  const rawMembers = Array.isArray(payload.members) ? payload.members : [];

  if (!name || !mascot) {
    const error = new Error('Team requires a name and mascot');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const members = rawMembers.map((member) => {
    const memberId = member instanceof mongoose.Types.ObjectId ? member.toString() : typeof member === 'string' ? member : '';
    if (!memberId || !mongoose.isValidObjectId(memberId)) {
      const error = new Error('Team members must contain valid MongoDB ObjectIds');
      Object.assign(error, { status: 400 });
      throw error;
    }
    return new mongoose.Types.ObjectId(memberId);
  });

  const created = await Team.create({ name, mascot, members });
  return created.toObject();
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    {
      $project: {
        _id: 0,
        teamName: '$team.name',
        totalPoints: 1,
      },
    },
  ]);

  return rows.map((row, index) => ({
    teamName: row.teamName,
    totalPoints: row.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    const error = new Error('User not found');
    Object.assign(error, { status: 404 });
    throw error;
  }

  const latestActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const goalFocus = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.trim().toLowerCase() : '';
  const recentActivityType = typeof latestActivity?.type === 'string' ? latestActivity.type.trim().toLowerCase() : '';

  const focusMatches = new Set<string>();
  if (goalFocus) focusMatches.add(goalFocus);
  if (recentActivityType === 'run') focusMatches.add('endurance');
  if (recentActivityType === 'cycle') focusMatches.add('endurance');
  if (recentActivityType === 'strength') focusMatches.add('strength');
  if (recentActivityType) focusMatches.add(recentActivityType);

  const preferredFocus = goalFocus || (recentActivityType === 'run' || recentActivityType === 'cycle' ? 'endurance' : recentActivityType || '');
  const workouts = await Workout.find().lean();

  const suggestions = workouts
    .map((workout) => {
      const workoutFocus = typeof workout.focus === 'string' ? workout.focus.toLowerCase() : '';
      const matchesGoal = goalFocus && workoutFocus === goalFocus;
      const matchesRecent = preferredFocus && workoutFocus === preferredFocus;
      const reason = `Based on ${user.name || user.email}'s ${goalFocus || recentActivityType || 'activity'} pattern and recent ${recentActivityType || 'activity'}, this ${workout.title} workout matches the activity.`;
      return { ...workout, reason, _matchScore: matchesGoal ? 2 : matchesRecent ? 1 : 0 };
    })
    .sort((left, right) => Number(right._matchScore) - Number(left._matchScore))
    .map(({ _matchScore, ...workout }) => workout);

  return suggestions.filter((workout) => {
    if (!preferredFocus) return true;
    return workout.focus.toLowerCase() === preferredFocus || (goalFocus && workout.focus.toLowerCase() === goalFocus);
  }).length ? suggestions.filter((workout) => {
    if (!preferredFocus) return true;
    return workout.focus.toLowerCase() === preferredFocus || (goalFocus && workout.focus.toLowerCase() === goalFocus);
  }) : suggestions;
}

export { User };
