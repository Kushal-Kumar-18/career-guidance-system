import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import SkillChips from '../components/SkillChips';
import PageHeader from '../components/PageHeader';

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = (searchParams.get('names') || '').split(',').filter(Boolean);
  const [names, setNames] = useState(initial.length ? initial : ['', '']);
  const [submitted, setSubmitted] = useState(initial.length >= 2 ? initial : null);

  const { data, loading, error, run } = useAsync(
    () => (submitted ? api.compareCareers(submitted) : Promise.resolve(null)),
    [submitted?.join(',')]
  );

  function updateName(idx, value) {
    setNames((prev) => prev.map((n, i) => (i === idx ? value : n)));
  }

  function addSlot() {
    if (names.length < 3) setNames((prev) => [...prev, '']);
  }

  function removeSlot(idx) {
    setNames((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const cleaned = names.map((n) => n.trim()).filter(Boolean);
    if (cleaned.length < 2) return;
    setSearchParams({ names: cleaned.join(',') });
    setSubmitted(cleaned);
  }

  const rows = [
    { label: 'Salary range', key: 'salary_range' },
    { label: 'Job growth', key: 'job_growth' },
    { label: 'Education', key: 'education', isList: true },
  ];

  return (
    <div>
      <PageHeader title="Compare careers" description="Pick two or three tracked careers to see how they stack up." />

      <form className="card" onSubmit={handleSubmit} style={{ marginBottom: '1.4rem' }}>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          {names.map((n, i) => (
            <div key={i} className="field" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
              <label htmlFor={`career-${i}`}>Career {i + 1}</label>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input id={`career-${i}`} value={n} onChange={(e) => updateName(i, e.target.value)} placeholder="e.g. Data Scientist" />
                {names.length > 2 && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeSlot(i)} aria-label={`Remove career ${i + 1}`}>
                    &times;
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="row">
            {names.length < 3 && (
              <button type="button" className="btn btn-secondary" onClick={addSlot}>+ Add career</button>
            )}
            <button className="btn btn-primary" type="submit">Compare</button>
          </div>
        </div>
      </form>

      {loading && <LoadingState rows={6} />}
      {error && <ErrorState error={error} onRetry={run} />}

      {!submitted && !loading && (
        <EmptyState title="Nothing to compare yet" description="Enter at least two career names above and hit Compare." />
      )}

      {data && data.length > 0 && (
        <div className="table-wrap">
          <table className="data" style={{ minWidth: 480 }}>
            <thead>
              <tr>
                <th></th>
                {data.map((c) => (
                  <th key={c.name}><Link to={`/careers/${encodeURIComponent(c.name)}`}>{c.name}</Link></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.label}</td>
                  {data.map((c) => (
                    <td key={c.name}>{row.isList ? (c[row.key] || []).join(', ') || '—' : c[row.key] || '—'}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td style={{ fontWeight: 600, verticalAlign: 'top' }}>Skills</td>
                {data.map((c) => (
                  <td key={c.name} style={{ verticalAlign: 'top' }}>
                    <SkillChips skills={(c.skills || []).slice(0, 8)} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
