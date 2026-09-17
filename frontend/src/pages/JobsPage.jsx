import { useState } from 'react';
import { api } from '../services/api';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import StatTile from '../components/StatTile';
import Icon from '../components/Icon';

export default function JobsPage() {
  const [career, setCareer] = useState('');
  const [jobs, setJobs] = useState(null);
  const [demand, setDemand] = useState(null);
  const [emerging, setEmerging] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);
  // Provenance of the trend numbers: how many REAL postings they were
  // computed from, and how many synthetic 'estimated' rows were skipped.
  // Trend endpoints exclude synthetic postings entirely, so this can
  // legitimately be 0 even when the jobs list above is full.
  const [trendProvenance, setTrendProvenance] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!career.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [jobsData, demandData, insightsData, emergingData] = await Promise.all([
        api.searchJobs(career.trim()),
        api.skillDemand(career.trim()),
        api.marketInsights(career.trim()),
        api.emergingSkills(career.trim()),
      ]);
      setJobs(jobsData.jobs);
      setSource(jobsData.source);
      setDemand(demandData.skill_demand);
      setInsights(insightsData);
      setEmerging(emergingData.emerging_skills);
      setTrendProvenance({
        postings_analyzed: demandData.postings_analyzed,
        synthetic_postings_excluded: demandData.synthetic_postings_excluded,
        note: demandData.note,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Job market" description="Live job search, skill demand, and market insights per career." />

      <form className="card" onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
            <label htmlFor="career">Career / keyword</label>
            <input id="career" value={career} onChange={(e) => setCareer(e.target.value)} placeholder="e.g. Data Scientist" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className="banner banner-error" role="alert">{error}</div>}
      {loading && <LoadingState rows={4} />}

      {source === 'estimated' && jobs && (
        <div className="banner banner-warn">
          Showing estimated listings — connect an Adzuna API key for live postings.
        </div>
      )}

      {jobs && jobs.length > 0 && (
        <div className="stack" style={{ marginTop: '1rem' }}>
          {jobs.map((j, i) => (
            <div key={i} className="card">
              <h3 style={{ margin: 0 }}>{j.title}</h3>
              <p className="hint" style={{ marginTop: '0.3rem' }}>{j.company} &middot; {j.location}</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{j.description}</p>
              {j.url && <a href={j.url} target="_blank" rel="noreferrer">View listing</a>}
            </div>
          ))}
        </div>
      )}

      {trendProvenance && trendProvenance.postings_analyzed === 0 && (
        <div className="card" style={{ marginTop: '1.4rem' }}>
          <div className="section-head"><h3>Market trends unavailable</h3></div>
          <p className="hint" style={{ margin: 0 }}>
            {trendProvenance.note}
            {trendProvenance.synthetic_postings_excluded > 0 &&
              ` ${trendProvenance.synthetic_postings_excluded} estimated listing(s) were excluded from these figures because they are generated from our own career dataset, not observed in the job market.`}
          </p>
        </div>
      )}

      {insights && trendProvenance?.postings_analyzed > 0 && (
        <div className="card" style={{ marginTop: '1.4rem' }}>
          <div className="section-head"><h3>Market insights</h3></div>
          <div className="grid-auto">
            <StatTile label="Jobs analyzed" value={insights.total_jobs} size="sm" />
            <StatTile label="Unique skills seen" value={insights.unique_skills} size="sm" />
            <StatTile label="Avg skills / job" value={insights.avg_skills_per_job} size="sm" />
            <StatTile label="Top location" value={insights.top_location || '—'} size="sm" />
          </div>
          <p className="hint" style={{ marginTop: '0.9rem' }}>
            Based on {trendProvenance.postings_analyzed} real posting(s).
            {trendProvenance.synthetic_postings_excluded > 0 &&
              ` ${trendProvenance.synthetic_postings_excluded} estimated listing(s) excluded.`}
          </p>
        </div>
      )}

      {demand && demand.length > 0 && trendProvenance?.postings_analyzed > 0 && (
        <div className="card" style={{ marginTop: '1.4rem' }}>
          <div className="section-head"><h3>Skill demand</h3></div>
          <div className="stack-sm">
            {demand.slice(0, 10).map((d) => (
              <div key={d.skill_name}>
                <div className="row-between" style={{ marginBottom: '0.25rem', fontSize: '0.86rem' }}>
                  <span>{d.skill_name}</span>
                  <span className="muted">{d.percentage}%</span>
                </div>
                <div className="meter"><span style={{ width: `${d.percentage}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {emerging && emerging.length > 0 && trendProvenance?.postings_analyzed > 0 && (
        <div className="card" style={{ marginTop: '1.4rem' }}>
          <div className="section-head"><h3>Top emerging skills to prioritize</h3></div>
          <div className="chip-set">
            {emerging.map((d) => (
              <span key={d.skill_name} className="chip chip-matched">
                <Icon name="sparkle" size={12} /> {d.skill_name} · {d.percentage}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
