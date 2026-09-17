import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import CareerCard from '../components/CareerCard';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';

export default function CareersPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]);
  const [savingName, setSavingName] = useState(null);
  const { data, loading, error, run } = useAsync(() => api.listCareers(query), [query]);
  // GET /careers/saved existed on the backend already but nothing in the
  // UI called it, so a "saved career" had no way to be seen or undone
  // once saved. Wiring it here (list + toggle) closes that gap.
  const { data: savedRows, run: refreshSaved } = useAsync(api.listSavedCareers, []);

  const savedNames = useMemo(() => new Set((savedRows || []).map((s) => s.career_name)), [savedRows]);

  function toggleSelected(name) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : prev.length < 3 ? [...prev, name] : prev
    );
  }

  async function toggleSaved(name) {
    setSavingName(name);
    try {
      if (savedNames.has(name)) {
        await api.unsaveCareer(name);
      } else {
        await api.saveCareer(name);
      }
      refreshSaved();
    } catch {
      // non-critical — leave the UI as-is, the user can retry the click
    } finally {
      setSavingName(null);
    }
  }

  return (
    <div>
      <PageHeader title="Explore careers" description="Browse the full tracked career catalog. Pick up to three to compare side by side, or save careers to come back to later." />

      {savedRows && savedRows.length > 0 && (
        <div className="card" style={{ marginBottom: '1.2rem' }}>
          <div className="section-head"><h3>Your saved careers</h3></div>
          <div className="list">
            {savedRows.map((s) => (
              <div key={s.career_name} className="list-row">
                <Link to={`/careers/${encodeURIComponent(s.career_name)}`}>{s.career_name}</Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => toggleSaved(s.career_name)}
                  disabled={savingName === s.career_name}
                >
                  {savingName === s.career_name ? 'Removing…' : 'Unsave'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="row" style={{ marginBottom: '1.2rem' }}>
        <div className="field" style={{ maxWidth: 360, marginBottom: 0, flex: 1 }}>
          <label htmlFor="career_search" className="visually-hidden">Search careers</label>
          <input id="career_search" placeholder="Search careers (e.g. Data, Design, Nurse)" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Link
          className="btn btn-secondary"
          to={selected.length >= 2 ? `/compare?names=${selected.map(encodeURIComponent).join(',')}` : '/compare'}
          aria-disabled={selected.length < 2}
          style={selected.length < 2 ? { pointerEvents: 'none', opacity: 0.5 } : undefined}
        >
          <Icon name="columns" size={15} /> Compare selected ({selected.length})
        </Link>
      </div>

      {loading && <LoadingState rows={4} />}
      {error && <ErrorState error={error} onRetry={run} />}
      {data && data.length === 0 && <EmptyState icon="search" title="No careers found" description="Try a different search term." />}

      {data && data.length > 0 && (
        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {data.map((c) => (
            <CareerCard
              key={c.name}
              career={c}
              footer={
                <div className="stack-sm" style={{ marginTop: '0.7rem' }}>
                  <label className="check" style={{ fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(c.name)}
                      onChange={() => toggleSelected(c.name)}
                      disabled={!selected.includes(c.name) && selected.length >= 3}
                    />
                    Select to compare
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => toggleSaved(c.name)}
                    disabled={savingName === c.name}
                  >
                    {savingName === c.name ? 'Saving…' : savedNames.has(c.name) ? 'Saved ✓' : 'Save career'}
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}