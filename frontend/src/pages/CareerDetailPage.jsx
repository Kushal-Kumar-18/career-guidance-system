import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import SkillChips from '../components/SkillChips';
import StatTile from '../components/StatTile';
import Icon from '../components/Icon';

export default function CareerDetailPage() {
  const { name } = useParams();
  const { data: career, loading, error, run } = useAsync(() => api.getCareer(name), [name]);
  const { data: myths } = useAsync(() => api.careerMyths(name), [name]);
  const { data: investment } = useAsync(() => api.careerInvestment(name), [name]);
  // Saved status lives on the backend (saved_careers table), not just in
  // this component's state — without checking it, revisiting a career
  // you'd already saved showed "Save career" again instead of "Saved",
  // and there was no way to undo a save at all.
  const { data: savedRows, run: refreshSaved } = useAsync(api.listSavedCareers, []);
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState(20);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  const isSaved = (savedRows || []).some((s) => s.career_name === name);

  async function handleWeeklyPlan(e) {
    e.preventDefault();
    setPlanLoading(true);
    try {
      const plan = await api.careerWeeklyPlan(name, hours);
      setWeeklyPlan(plan);
    } catch (e2) {
      // non-critical
    } finally {
      setPlanLoading(false);
    }
  }

  async function handleToggleSave() {
    setSaving(true);
    try {
      if (isSaved) {
        await api.unsaveCareer(name);
      } else {
        await api.saveCareer(name);
      }
      refreshSaved();
    } catch (e) {
      // non-critical
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState rows={6} />;
  if (error) return <ErrorState error={error} onRetry={run} />;
  if (!career) return null;

  return (
    <div>
      <PageHeader
        title={career.name}
        action={
          <div className="row">
            <Link className="btn btn-primary" to={`/careers/${encodeURIComponent(name)}/roadmap`}>View roadmap</Link>
            <Link className="btn btn-secondary" to={`/compare?names=${encodeURIComponent(name)},`}>Compare</Link>
            <button className="btn btn-secondary" onClick={handleToggleSave} disabled={saving}>
              {saving ? 'Saving…' : isSaved ? 'Unsave' : 'Save career'}
            </button>
          </div>
        }
      />

      <div className="row" style={{ marginBottom: '1.4rem' }}>
        {career.salary_range && <span className="chip chip-neutral">{career.salary_range}</span>}
        {career.job_growth && <span className="chip chip-matched">Growth: {career.job_growth}</span>}
      </div>

      <div className="stack">
        <div className="card">
          <div className="section-head"><h3>Core skills</h3></div>
          <SkillChips skills={career.skills} />
        </div>

        {career.education?.length > 0 && (
          <div className="card">
            <div className="section-head"><h3>Typical education paths</h3></div>
            <SkillChips skills={career.education} variant="verified" />
          </div>
        )}

        {career.courses?.length > 0 && (
          <div className="card">
            <div className="section-head"><h3>Learning resources</h3></div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {career.courses.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
        )}

        {investment && (
          <div className="card">
            <div className="section-head"><h3>Estimated investment</h3></div>
            <div className="grid-auto" style={{ marginBottom: '0.8rem' }}>
              <StatTile label="Time" value={investment.time_investment} size="sm" />
              <StatTile label="Estimated cost" value={investment.financial_investment} size="sm" />
              <StatTile label="Potential ROI" value={investment.potential_roi} size="sm" />
            </div>
            <div className="stack-sm">
              {Object.entries(investment.breakdown).map(([k, v]) => (
                <div key={k} className="row-between" style={{ maxWidth: 340, fontSize: '0.88rem' }}>
                  <span className="muted" style={{ textTransform: 'capitalize' }}>{k.replaceAll('_', ' ')}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            {investment.free_alternative_available && (
              <p className="hint" style={{ marginTop: '0.7rem' }}>
                Free/low-cost alternatives (open courseware, docs, community forums) can meaningfully reduce this.
              </p>
            )}
          </div>
        )}

        <div className="card">
          <div className="section-head"><h3>Weekly learning plan</h3></div>
          <form onSubmit={handleWeeklyPlan} className="row" style={{ alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="hours">Hours/week you can commit</label>
              <input id="hours" type="number" min="1" max="80" value={hours} onChange={(e) => setHours(e.target.value)} style={{ width: 100 }} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={planLoading}>
              {planLoading ? 'Building…' : 'Build plan'}
            </button>
          </form>

          {weeklyPlan && (
            <div className="stack">
              <div>
                <h4>Suggested breakdown ({weeklyPlan.total_hours}h/week)</h4>
                <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem' }}>
                  {Object.entries(weeklyPlan.breakdown).map(([k, v]) => <li key={k}>{k}: {v}</li>)}
                </ul>
              </div>
              <div>
                <h4>Daily rhythm</h4>
                <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem' }}>
                  {Object.entries(weeklyPlan.daily_schedule).map(([k, v]) => <li key={k}>{k}: {v}</li>)}
                </ul>
              </div>
              {weeklyPlan.focus_areas_week_1?.length > 0 && (
                <div>
                  <h4>Week 1 focus</h4>
                  <SkillChips skills={weeklyPlan.focus_areas_week_1} />
                </div>
              )}
              <div>
                <h4>Tips</h4>
                <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem' }}>
                  {weeklyPlan.tips.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>

        {myths && (
          <div className="card">
            <div className="section-head"><h3>Myths vs. reality</h3></div>
            <div className="stack">
              {myths.map((m, i) => (
                <div key={i}>
                  <div style={{ fontWeight: 600 }}><Icon name="alert" size={14} /> Myth: {m.myth}</div>
                  <p className="hint" style={{ marginTop: '0.2rem' }}>Reality: {m.reality}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}