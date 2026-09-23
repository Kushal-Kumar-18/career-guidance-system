import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import SkillChips from '../components/SkillChips';
import Icon from '../components/Icon';

// A row of external resource links rendered as chips. Every link this
// page ever renders comes from the backend's roadmapService — either a
// hand-verified static page or a dynamically-built platform search URL
// (see backend/src/data/roadmapResources.js) — so this component just
// displays whatever it's given, opening it in a new tab.
function ResourceLinks({ items, iconName = 'link', emptyLabel }) {
  if (!items?.length) {
    return emptyLabel ? <span className="tiny">{emptyLabel}</span> : null;
  }
  return (
    <div className="chip-set">
      {items.map((item) => (
        <a key={item.url} className="chip chip-neutral" href={item.url} target="_blank" rel="noopener noreferrer">
          <Icon name={iconName} size={12} />
          {item.title}
        </a>
      ))}
    </div>
  );
}

function ResourceGroup({ title, items, iconName }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="tiny" style={{ marginBottom: '0.35rem' }}>{title}</div>
      <ResourceLinks items={items} iconName={iconName} />
    </div>
  );
}

export default function RoadmapPage() {
  const { career } = useParams();
  const { user } = useAuth();
  const fetcher = user ? () => api.personalizedRoadmap(career) : () => api.roadmapFor(career);
  const { data, loading, error, run } = useAsync(fetcher, [career, !!user]);

  if (loading) return <LoadingState rows={6} />;
  if (error) return <ErrorState error={error} onRetry={run} />;
  if (!data) return null;

  const hasFreeCerts = data.free_certifications?.length > 0;
  const hasOpenSource = data.open_source?.length > 0;

  return (
    <div>
      <PageHeader
        title={data.career}
        description={data.overview || `Estimated total duration: ${data.total_duration}`}
      />

      <div className="stack">
        {!user && (
          <div className="banner banner-info">
            <Link to="/login">Sign in</Link> and complete your profile to personalize this roadmap to the skills you
            already have.
          </div>
        )}

        {data.personalized && (
          <div className="card">
            <div className="section-head"><h3>Your skill gap for this career</h3></div>
            <div className="stack-sm">
              <div>
                <div className="tiny" style={{ marginBottom: '0.3rem' }}>You already have</div>
                <SkillChips skills={data.demonstrated_skills} variant="matched" emptyLabel="No matched skills yet" />
              </div>
              <div>
                <div className="tiny" style={{ marginBottom: '0.3rem' }}>Focus on next</div>
                <SkillChips skills={data.skills_to_learn} variant="gap" emptyLabel="You already cover every tracked skill 🎉" />
              </div>
            </div>
          </div>
        )}

        {data.phases.map((phase, idx) => (
          <div key={phase.phase} className="card">
            <div className="row-between">
              <h3 style={{ margin: 0 }}>{phase.phase}</h3>
              <span className="tiny">Phase {idx + 1} · {phase.duration}</span>
            </div>
            <div style={{ margin: '0.7rem 0' }}>
              <SkillChips skills={phase.focus_skills} variant={data.personalized ? 'gap' : 'neutral'} />
            </div>
            <ul style={{ margin: '0 0 0.6rem', paddingLeft: '1.1rem' }}>
              {phase.milestones.map((m) => <li key={m}>{m}</li>)}
            </ul>
            {phase.resources?.length > 0 && (
              <p className="hint">Courses: {phase.resources.join(', ')}</p>
            )}
          </div>
        ))}

        {data.topics?.length > 0 && (
          <div className="card">
            <div className="section-head"><h3>Key topics & concepts</h3></div>
            <SkillChips skills={data.topics} variant="neutral" />
          </div>
        )}

        {data.resources && (
          <div className="card">
            <div className="section-head"><h3>Free learning resources</h3></div>
            {(data.resources.learn?.length || data.resources.docs?.length || data.resources.practice?.length) ? (
              <div className="stack-sm">
                <ResourceGroup title="Learn" items={data.resources.learn} iconName="document" />
                <ResourceGroup title="Documentation" items={data.resources.docs} iconName="document" />
                <ResourceGroup title="Practice" items={data.resources.practice} iconName="target" />
              </div>
            ) : (
              <p className="hint">
                No verified free resource was found for this specific career's skill set yet. Check the courses
                linked in each phase above, and the job/internship search below, in the meantime.
              </p>
            )}
          </div>
        )}

        {data.projects_suggested?.length > 0 && (
          <div className="card">
            <div className="section-head"><h3>Suggested projects</h3></div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {data.projects_suggested.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        )}

        {hasOpenSource && (
          <div className="card">
            <div className="section-head"><h3>Open-source opportunities</h3></div>
            <ResourceLinks items={data.open_source} iconName="link" />
          </div>
        )}

        <div className="card">
          <div className="section-head"><h3>Free / open certifications</h3></div>
          {hasFreeCerts ? (
            <div className="chip-set">
              {data.free_certifications.map((cert) => (
                <a key={cert.url} className="chip chip-verified" href={cert.url} target="_blank" rel="noopener noreferrer">
                  <Icon name="check" size={12} />
                  {cert.title}
                </a>
              ))}
            </div>
          ) : (
            <p className="hint">
              No genuinely free, verifiable certification was found for this specific career. Use the learning
              resources above to build skills, and check the courses linked in each phase for field-specific options.
            </p>
          )}
        </div>

        <div className="grid-auto">
          <div className="card">
            <div className="section-head"><h3>Job search</h3></div>
            <ResourceLinks items={data.job_search} iconName="briefcase" />
          </div>
          <div className="card">
            <div className="section-head"><h3>Internship search</h3></div>
            <ResourceLinks items={data.internship_search} iconName="briefcase" />
          </div>
        </div>

        {data.next_steps?.length > 0 && (
          <div className="card">
            <div className="section-head"><h3>Next steps</h3></div>
            <ol style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {data.next_steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
