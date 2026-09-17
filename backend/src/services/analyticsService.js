const recommendationRepository = require('../repositories/recommendationRepository');
const activityRepository = require('../repositories/activityRepository');
const skillTestRepository = require('../repositories/skillTestRepository');
const gameRepository = require('../repositories/gameRepository');
const jobRepository = require('../repositories/jobRepository');
const profileRepository = require('../repositories/profileRepository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const { query } = require('../config/db');

async function dashboard(userId) {
  const [recs, activity, skillResults, games] = await Promise.all([
    recommendationRepository.listByUser(userId, 10),
    activityRepository.listByUser(userId, 20),
    skillTestRepository.listResultsByUser(userId),
    gameRepository.listByUser(userId),
  ]);

  const avgSkillProficiency = skillResults.length
    ? Math.round(skillResults.reduce((a, r) => a + Number(r.percentage), 0) / skillResults.length)
    : 0;

  const topRecommendation = recs[0] || null;

  return {
    recent_recommendations: recs,
    top_recommendation: topRecommendation,
    activity_feed: activity,
    skills: {
      tests_taken: skillResults.length,
      average_proficiency: avgSkillProficiency,
      results: skillResults,
    },
    gamification: {
      games_played: games.length,
      total_badges: games.reduce((a, g) => a + g.badges_earned, 0),
      recent_games: games.slice(0, 5),
    },
  };
}

// Admin-level aggregate stats — doesn't expose per-user PII, just counts.
// Mirrors the original Flask admin panel's db.get_statistics(), extended
// with a couple of the extra counts the new schema makes easy to compute.
async function adminOverview() {
  const { rows: userCountRows } = await query(`SELECT COUNT(*)::int AS count FROM users`);
  const { rows: recCountRows } = await query(`SELECT COUNT(*)::int AS count FROM recommendation_history`);
  const { rows: topCareersRows } = await query(
    `SELECT career_name, COUNT(*)::int AS count FROM recommendation_history GROUP BY career_name ORDER BY count DESC LIMIT 10`
  );
  const { rows: testCountRows } = await query(`SELECT COUNT(*)::int AS count FROM skill_test_results`);
  const [jobPostingsCount, realJobPostingsCount, profilesCompleted, activeToday, gamesPlayed] = await Promise.all([
    jobRepository.countPostings(),
    // Split out so the admin view never reads a cache full of synthetic
    // fallback rows as real market coverage (see jobRepository.SYNTHETIC_SOURCES).
    jobRepository.countPostings({ excludeSynthetic: true }),
    profileRepository.countAll(),
    activityRepository.countActiveToday(),
    gameRepository.countAll(),
  ]);

  return {
    total_users: userCountRows[0].count,
    profiles_completed: profilesCompleted,
    active_today: activeToday,
    total_recommendations_generated: recCountRows[0].count,
    total_skill_tests_completed: testCountRows[0].count,
    total_games_played: gamesPlayed,
    total_job_postings_cached: jobPostingsCount,
    real_job_postings_cached: realJobPostingsCount,
    synthetic_job_postings_cached: jobPostingsCount - realJobPostingsCount,
    top_recommended_careers: topCareersRows,
  };
}

// Admin user management — list every account (no password hashes) and
// allow removing one. Mirrors the original admin panel's user table +
// delete action.
async function listUsers() {
  return userRepository.listAll();
}

async function deleteUser(requestingAdminId, targetUserId) {
  const idNum = parseInt(targetUserId, 10);
  if (String(requestingAdminId) === String(idNum)) {
    throw new ApiError(400, "You can't delete your own admin account while logged in as it.");
  }
  const target = await userRepository.findById(idNum);
  if (!target) throw new ApiError(404, 'User not found.');
  await userRepository.deleteById(idNum);
  return { removed: true, id: idNum };
}

module.exports = { dashboard, adminOverview, listUsers, deleteUser };
