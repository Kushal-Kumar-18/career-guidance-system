import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import StatTile from '../components/StatTile';

const COLORS = ['#7C8CF0', '#F2AC4C', '#35D6BE', '#F1667C', '#9B96BE', '#A98BD6'];
const AXIS_TICK = { fill: '#9B96BE', fontSize: 11 };

// Real analytics view backed entirely by GET /analytics/dashboard — no
// hardcoded demo numbers.
export default function AnalyticsPage() {
  const { data, loading, error, run } = useAsync(api.dashboard, []);

  if (loading) return <LoadingState rows={6} />;
  if (error) return <ErrorState error={error} onRetry={run} />;
  if (!data) return null;

  const skillTestChartData = (data.skills.results || []).map((r) => ({
    name: r.skill_name,
    percentage: Number(r.percentage),
  }));

  const gameChartData = (data.gamification.recent_games || [])
    .slice()
    .reverse()
    .map((g, i) => ({
      name: `#${i + 1}`,
      performance: Number(g.performance_score),
      learning: Number(g.learning_score),
    }));

  const recommendationsChartData = (data.recent_recommendations || []).map((r) => ({
    name: r.career_name,
    match: Number(r.match_score),
  }));

  return (
    <div>
      <PageHeader title="Your activity" description="Real data pulled from your recommendation, skill-test, and simulation history." />

      <div className="grid-auto" style={{ marginBottom: '1.6rem' }}>
        <div className="card"><StatTile label="Recommendations generated" value={data.recent_recommendations.length} /></div>
        <div className="card"><StatTile label="Skill tests taken" value={data.skills.tests_taken} /></div>
        <div className="card"><StatTile label="Avg. proficiency" value={`${data.skills.average_proficiency}%`} /></div>
        <div className="card"><StatTile label="Simulations played" value={data.gamification.games_played} /></div>
        <div className="card"><StatTile label="Badges earned" value={data.gamification.total_badges} /></div>
      </div>

      <div className="card" style={{ marginBottom: '1.4rem' }}>
        <div className="section-head"><h3>Recommendation match scores</h3></div>
        {recommendationsChartData.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={recommendationsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="name" tick={{ ...AXIS_TICK }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis domain={[0, 100]} tick={AXIS_TICK} />
              <Tooltip contentStyle={{ background: '#1D1A38', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, color: '#EFEDFB' }} labelStyle={{ color: '#EFEDFB' }} itemStyle={{ color: '#C6C2E0' }} />
              <Bar dataKey="match" fill="#7C8CF0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon="target"
            title="No recommendations yet"
            description="Generate recommendations to see match scores here."
            action={<Link className="btn btn-primary" to="/recommendations">Get recommendations</Link>}
          />
        )}
      </div>

      <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: '1.4rem' }}>
        <div className="card">
          <div className="section-head"><h3>Skill test proficiency</h3></div>
          {skillTestChartData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={skillTestChartData} dataKey="percentage" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {skillTestChartData.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1D1A38', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, color: '#EFEDFB' }} labelStyle={{ color: '#EFEDFB' }} itemStyle={{ color: '#C6C2E0' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon="check"
              title="No skill tests yet"
              description="Verify a skill to see your proficiency breakdown."
              action={<Link className="btn btn-primary" to="/skills">Verify skills</Link>}
            />
          )}
        </div>

        <div className="card">
          <div className="section-head"><h3>Simulation performance trend</h3></div>
          {gameChartData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={gameChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="name" tick={AXIS_TICK} />
                <YAxis domain={[0, 100]} tick={AXIS_TICK} />
                <Tooltip contentStyle={{ background: '#1D1A38', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, color: '#EFEDFB' }} labelStyle={{ color: '#EFEDFB' }} itemStyle={{ color: '#C6C2E0' }} />
                <Line type="monotone" dataKey="performance" stroke="#7C8CF0" strokeWidth={2} />
                <Line type="monotone" dataKey="learning" stroke="#F2AC4C" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon="play"
              title="No simulations played yet"
              description="Play the career simulator to track performance over time."
              action={<Link className="btn btn-primary" to="/game">Play simulator</Link>}
            />
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-head"><h3>Recent activity</h3></div>
        {data.activity_feed.length ? (
          <div className="list">
            {data.activity_feed.map((a) => (
              <div key={a.id} className="list-row" style={{ padding: '0.55rem 0' }}>
                <span style={{ fontSize: '0.88rem' }}>{a.action.replaceAll('_', ' ')}</span>
                <span className="tiny">{new Date(a.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="hint">No activity yet.</p>
        )}
      </div>
    </div>
  );
}