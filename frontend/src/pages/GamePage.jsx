import { useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import CareerCard from '../components/CareerCard';
import EmptyState from '../components/EmptyState';

// Career selection step: recommended careers first (from the user's own
// recommendation history, so it's real personalized data), falling back
// to a searchable browse of the full catalog. Nobody has to remember or
// correctly spell an exact career name any more.
function CareerPicker({ onPick, starting }) {
  const { data: history } = useAsync(api.recommendationHistory, []);
  const [query, setQuery] = useState('');
  const { data: browseResults, loading: browseLoading } = useAsync(() => api.listCareers(query), [query]);

  const recommended = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const h of history || []) {
      if (seen.has(h.career_name)) continue;
      seen.add(h.career_name);
      list.push({ name: h.career_name, match_score: h.match_score });
      if (list.length >= 4) break;
    }
    return list;
  }, [history]);

  return (
    <div className="stack">
      {recommended.length > 0 && (
        <div>
          <div className="section-head"><h3>Your recommended careers</h3></div>
          <div className="grid-auto">
            {recommended.map((c) => (
              <button
                key={c.name}
                type="button"
                className="card career-card"
                onClick={() => onPick(c.name)}
                disabled={Boolean(starting)}
                style={{ textAlign: 'left', cursor: 'pointer' }}
              >
                <h3 style={{ margin: 0 }}>{c.name}</h3>
                <span className="chip chip-matched" style={{ marginTop: '0.5rem' }}>{c.match_score}% match</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="section-head"><h3>Explore other careers</h3></div>
        <div className="field" style={{ maxWidth: 360 }}>
          <label htmlFor="sim_search" className="visually-hidden">Search careers</label>
          <input id="sim_search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search careers (e.g. Data, Design, Nurse)" />
        </div>
        {browseLoading && <LoadingState rows={2} />}
        {browseResults && browseResults.length === 0 && <p className="hint">No careers match that search.</p>}
        {browseResults && browseResults.length > 0 && (
          <div className="grid-auto" style={{ marginTop: '0.8rem' }}>
            {browseResults.slice(0, 9).map((c) => (
              <CareerCard key={c.name} career={c} onSelect={() => onPick(c.name)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GamePage() {
  const [career, setCareer] = useState(null);
  const [game, setGame] = useState(null);
  const [choices, setChoices] = useState({});
  const [starting, setStarting] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { data: history } = useAsync(api.gameHistory, []);

  async function startGame(name) {
    setStarting(true);
    setError(null);
    setResult(null);
    setChoices({});
    try {
      const data = await api.generateGame(name);
      setGame(data);
      setCareer(name);
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  }

  async function submitGame() {
    setScoring(true);
    setError(null);
    try {
      const data = await api.playGame({ career: game.career, choices, scenarios: game.scenarios });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setScoring(false);
    }
  }

  function playAnother() {
    setGame(null);
    setResult(null);
    setCareer(null);
  }

  const allAnswered = game && game.scenarios.every((s) => choices[s.id]);

  return (
    <div>
      <PageHeader title="Career simulator" description="Play through a day in the life of a career and see how your decisions score." />

      {error && <div className="banner banner-error" role="alert">{error}</div>}

      {!game && <CareerPicker onPick={startGame} starting={starting} />}
      {starting && <LoadingState rows={3} label="Building your simulation" />}

      {game && !result && (
        <div className="card">
          <div className="row-between">
            <h2 style={{ margin: 0 }}>{game.career}</h2>
            <button type="button" className="btn btn-quiet btn-sm" onClick={playAnother}>Choose a different career</button>
          </div>
          <p className="hint">{game.scenarios.filter((s) => choices[s.id]).length} of {game.scenarios.length} scenarios answered</p>
          <div className="meter" style={{ marginBottom: '1.2rem' }}>
            <span style={{ width: `${(game.scenarios.filter((s) => choices[s.id]).length / game.scenarios.length) * 100}%` }} />
          </div>

          <div className="stack">
            {game.scenarios.map((s, idx) => (
              <div key={s.id}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Scenario {idx + 1}: {s.prompt}</div>
                <div className="stack-sm">
                  {s.choices.map((c) => (
                    <label key={c.id} className="check">
                      <input type="radio" name={s.id} checked={choices[s.id] === c.id} onChange={() => setChoices((ch) => ({ ...ch, [s.id]: c.id }))} />
                      {c.text}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={submitGame} disabled={!allAnswered || scoring} style={{ marginTop: '1.2rem' }}>
            {scoring ? 'Scoring…' : 'See results'}
          </button>
        </div>
      )}

      {result && (
        <div className="card">
          <span className="tiny">Result</span>
          <h2 style={{ marginTop: '0.2rem' }}>{result.performance_level}</h2>
          <div className="grid-auto" style={{ margin: '1rem 0' }}>
            <MiniStat label="Performance" value={`${result.performance_score}%`} />
            <MiniStat label="Stress" value={`${result.stress_score}%`} />
            <MiniStat label="Learning" value={`${result.learning_score}%`} />
          </div>
          <p>Badges earned: {result.badges_earned}</p>
          <div className="row">
            <button className="btn btn-primary" onClick={() => startGame(career)}>Play {career} again</button>
            <button className="btn btn-secondary" onClick={playAnother}>Try a different career</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <div className="section-head"><h2>History</h2></div>
        {!history && <LoadingState rows={2} />}
        {history && history.length === 0 && (
          <EmptyState icon="play" title="No simulations played yet" description="Pick a career above to try your first one." />
        )}
        {history && history.length > 0 && (
          <div className="card card-flush">
            <div className="list">
              {history.map((g) => (
                <div key={g.id} className="list-row">
                  <strong>{g.career}</strong>
                  <span className="chip chip-matched">{g.performance_level}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div className="tiny">{label}</div>
      <div className="score score-md">{value}</div>
    </div>
  );
}
