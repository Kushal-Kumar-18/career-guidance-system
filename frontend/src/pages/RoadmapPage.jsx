import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import SkillChips from '../components/SkillChips';

export default function RoadmapPage() {
  const { career } = useParams();
  const { user } = useAuth();
  const fetcher = user ? () => api.personalizedRoadmap(career) : () => api.roadmapFor(career);
  const { data, loading, error, run } = useAsync(fetcher, [career, !!user]);

  if (loading) return <LoadingState rows={6} />;
  if (error) return <ErrorState error={error} onRetry={run} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title={data.career} description={`Estimated total duration: ${data.total_duration}`} />

      <div className="stack">
        {data.your_missing_skills && (
          <div className="card">
            <div className="section-head"><h3>Your current gap</h3></div>
            <SkillChips skills={data.your_missing_skills} variant="gap" />
          </div>
        )}

        {data.phases.map((phase, idx) => (
          <div key={phase.phase} className="card">
            <div className="row-between">
              <h3 style={{ margin: 0 }}>{phase.phase}</h3>
              <span className="tiny">Phase {idx + 1} · {phase.duration}</span>
            </div>
            <div style={{ margin: '0.7rem 0' }}>
              <SkillChips skills={phase.focus_skills} />
            </div>
            <ul style={{ margin: '0 0 0.6rem', paddingLeft: '1.1rem' }}>
              {phase.milestones.map((m) => <li key={m}>{m}</li>)}
            </ul>
            {phase.resources?.length > 0 && (
              <p className="hint">Resources: {phase.resources.join(', ')}</p>
            )}
          </div>
        ))}

        {data.projects_suggested?.length > 0 && (
          <div className="card">
            <div className="section-head"><h3>Suggested projects</h3></div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {data.projects_suggested.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
