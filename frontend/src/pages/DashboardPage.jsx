import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { profileCompleteness, classifyProfileSkills } from '../lib/profile';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import StatTile from '../components/StatTile';
import CompletenessMeter from '../components/CompletenessMeter';
import Icon from '../components/Icon';

// Human-readable labels for the activity feed. Falls back to a
// de-underscored version of the raw action name for anything not
// listed here (e.g. a future action type), so the feed never breaks,
// it just looks a little less polished until this map is updated.
const ACTIVITY_LABELS = {
  profile_update: 'Updated profile',
  profile_resume_applied: 'Applied resume details to profile',
  resume_uploaded: 'Uploaded a resume',
  recommendations_generated: 'Generated recommendations',
  recommendation_feedback: 'Rated a recommendation',
  skill_test_generated: 'Started a skill test',
  skill_test_submitted: 'Completed a skill test',
};

// The dashboard is assembled entirely from three real endpoints
// (dashboard, profile, skill-test results) — nothing here is invented to
// fill space. Where there's genuinely no data yet (no recommendations,
// no verified skills), the card says so and points at the action that
// would produce it, rather than showing a fabricated placeholder number.
export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, run } = useAsync(api.dashboard, []);
  const { data: profileData } = useAsync(api.getProfile, []);
  const { data: testResults } = useAsync(api.skillTestResults, []);

  if (loading) return <LoadingState rows={6} />;
  if (error) return <ErrorState error={error} onRetry={run} />;
  if (!data) return null;

  const completeness = profileCompleteness(profileData?.profile);
  const skillBreakdown = classifyProfileSkills(profileData?.profile, testResults || []);
  const topRec = data.top_recommendation;

  // The single most useful thing to do right now, in priority order.
  // Only one is shown so the dashboard suggests one clear next step
  // instead of a wall of equally-weighted CTAs.
  const nextAction = (() => {
    if (completeness.percent < 40) {
      return { to: '/profile', icon: 'user', title: 'Finish your profile', body: 'A fuller profile means sharper recommendations.', cta: 'Go to profile' };
    }
    if (!topRec) {
      return { to: '/recommendations', icon: 'target', title: 'Get your first recommendations', body: 'See which careers line up with what you already have.', cta: 'Get recommendations' };
    }
    if (skillBreakdown.unverified.length > 0) {
      return {
        to: '/skills',
        icon: 'check',
        title: `Verify ${skillBreakdown.unverified[0].name}`,
        body: 'Verified skills carry more weight as evidence than self-reported ones.',
        cta: 'Take an assessment',
      };
    }
    return { to: '/careers', icon: 'compass', title: 'Explore more careers', body: 'Browse the full catalog to see what else might fit.', cta: 'Explore careers' };
  })();

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.username}`}
        description="Here's where your career profile stands, and what would move it forward."
      />

      <div className="stack">
        <div className="grid-auto">
          <div className="card"><StatTile label="Skill tests taken" value={data.skills.tests_taken} /></div>
          <div className="card"><StatTile label="Verified skills" value={skillBreakdown.verified.length} /></div>
          <div className="card"><StatTile label="Simulations played" value={data.gamification.games_played} /></div>
          <div className="card"><StatTile label="Badges earned" value={data.gamification.total_badges} /></div>
        </div>

        <div className="card">
          <div className="section-head"><h2>Profile completeness</h2></div>
          <CompletenessMeter percent={completeness.percent} missing={completeness.missing} />
        </div>

        <div className="card">
          <div className="section-head">
            <h2>Top recommendation</h2>
            {topRec && <Link to="/recommendations" className="btn btn-quiet btn-sm">See all <Icon name="arrow" size={14} /></Link>}
          </div>
          {topRec ? (
            <div className="row-between">
              <div>
                <Link to={`/careers/${encodeURIComponent(topRec.career_name)}`}><h3 style={{ margin: 0 }}>{topRec.career_name}</h3></Link>
                <p className="hint" style={{ marginTop: '0.3rem' }}>Alignment score: {topRec.match_score}%</p>
              </div>
              <div className="row">
                <Link className="btn btn-secondary btn-sm" to={`/careers/${encodeURIComponent(topRec.career_name)}/roadmap`}>View roadmap</Link>
                <Link className="btn btn-primary btn-sm" to="/recommendations">Improve match</Link>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="target"
              title="No recommendations yet"
              description="Complete your profile, then generate recommendations to see careers that fit."
              action={<Link className="btn btn-primary" to={completeness.percent < 40 ? '/profile' : '/recommendations'}>{completeness.percent < 40 ? 'Go to profile' : 'Get recommendations'}</Link>}
            />
          )}
        </div>

        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div className="card">
            <div className="section-head"><h3>Skills</h3></div>
            {skillBreakdown.all.length ? (
              <div className="stack-sm">
                <div className="row-between">
                  <span className="hint">Verified</span>
                  <span className="chip chip-verified">{skillBreakdown.verified.length}</span>
                </div>
                <div className="row-between">
                  <span className="hint">Self-reported only</span>
                  <span className="chip chip-neutral">{skillBreakdown.unverified.length}</span>
                </div>
                <Link className="btn btn-secondary btn-sm" style={{ marginTop: '0.3rem' }} to="/skills">Verify a skill</Link>
              </div>
            ) : (
              <EmptyState icon="check" title="No skills listed" description="Add skills to your profile to start verifying them." action={<Link className="btn btn-secondary btn-sm" to="/profile">Add skills</Link>} />
            )}
          </div>

          <div className="card">
            <div className="section-head"><h3>Resume</h3></div>
            <p className="hint">Build a resume from your profile, generate a PDF, or check it against a target role.</p>
            <Link className="btn btn-secondary btn-sm" to="/resume">Go to resume</Link>
          </div>
        </div>

        <div className="card" style={{ borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }}>
          <div className="row" style={{ gap: '1rem', alignItems: 'flex-start' }}>
            <Icon name={nextAction.icon} size={22} style={{ color: 'var(--accent-hover)', flexShrink: 0, marginTop: '0.15rem' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0 }}>{nextAction.title}</h3>
              <p className="hint" style={{ marginTop: '0.25rem' }}>{nextAction.body}</p>
            </div>
            <Link className="btn btn-primary btn-sm" to={nextAction.to}>{nextAction.cta}</Link>
          </div>
        </div>

        <div className="card">
          <div className="section-head"><h3>Recent activity</h3></div>
          {data.activity_feed.length ? (
            <div className="list">
              {data.activity_feed.slice(0, 8).map((a) => (
                <div key={a.id} className="list-row" style={{ padding: '0.55rem 0' }}>
                  <span style={{ fontSize: '0.88rem' }}>{ACTIVITY_LABELS[a.action] || a.action.replaceAll('_', ' ')}</span>
                  <span className="tiny">{new Date(a.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="hint">Nothing yet — actions across the app will show up here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
