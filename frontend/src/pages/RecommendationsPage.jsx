import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { buildEvidence } from '../lib/profile';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import EvidenceBar from '../components/EvidenceBar';
import SkillChips from '../components/SkillChips';
import Icon from '../components/Icon';

// Human labels for the four candidate-profile sources — see
// backend/src/services/recommendationService.js resolveCandidateProfile.
const SOURCE_LABELS = {
  profile: 'your profile',
  resume_builder: 'your Resume Builder resume',
  resume_upload: 'your uploaded resume',
  merge: 'your profile merged with your uploaded resume',
};

// Rates the EXACT recommendation the user is looking at, by its
// `recommendationId` (the recommendation_history row id returned by
// generateRecommendations) — not by career name. The same career can
// legitimately appear in more than one analysis for this user, and a
// name-based lookup could silently attach the rating to the wrong one;
// see backend recommendationService.submitFeedback.
function FeedbackWidget({ recommendationId }) {
  const [rating, setRating] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | saving | done | error

  async function submit(value) {
    if (!recommendationId) {
      setStatus('error');
      return;
    }
    setRating(value);
    setStatus('saving');
    try {
      await api.submitRecommendationFeedback(recommendationId, value);
      setStatus('done');
    } catch (err) {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return <p className="hint" style={{ marginTop: '0.6rem' }}>Thanks — this helps calibrate future recommendations.</p>;
  }

  return (
    <div style={{ marginTop: '0.7rem' }}>
      <span className="hint">Was this a good suggestion?</span>
      <div className="row" style={{ marginTop: '0.35rem' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.3rem 0.7rem', opacity: rating && rating !== n && status === 'saving' ? 0.5 : 1 }}
            disabled={status === 'saving'}
            onClick={() => submit(n)}
            title={`${n} out of 5`}
          >
            {n}
          </button>
        ))}
        {status === 'error' && <span className="field-error">Couldn't save that — try again.</span>}
      </div>
    </div>
  );
}

function RecommendationCard({ r, rank }) {
  const [expanded, setExpanded] = useState(rank === 0);
  const evidence = buildEvidence({
    matchedSkills: r.user_skills_matched || [],
    gaps: r.skill_gaps || [],
    testResults: [], // Verified status for matched skills isn't in the API response yet;
    // the bar still separates matched from missing, which is the data we do have.
  });

  return (
    <div className="card">
      <div className="row-between">
        <div>
          <span className="tiny">#{rank + 1} match</span>
          <h3 style={{ marginTop: '0.15rem' }}>
            <Link to={`/careers/${encodeURIComponent(r.career)}`}>{r.career}</Link>
          </h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="score score-md">
            {Math.round(r.fit_score ?? r.confidence)}<span className="score-unit">% fit</span>
          </div>
          {r.fit_label && <div className="tiny">{r.fit_label}</div>}
        </div>
      </div>

      {evidence.total > 0 && (
        <div style={{ marginTop: '0.9rem' }}>
          <EvidenceBar evidence={evidence} />
        </div>
      )}

      <p style={{ marginTop: '0.9rem' }}>
        {r.salary_range} &middot; Job-market demand: {r.market_outlook?.label || r.job_growth}
      </p>

      {r.reasoning && <p className="hint">Why this career: {r.reasoning}</p>}

      {r.skill_gaps?.length > 0 && (
        <div style={{ marginTop: '0.7rem' }}>
          <h4 style={{ marginBottom: '0.4rem' }}>Skills to build</h4>
          <SkillChips
            items={[
              ...(r.skill_gaps_by_tier?.essential || []).map((name) => ({ name, variant: 'gap' })),
              ...(r.skill_gaps || [])
                .filter((s) => !(r.skill_gaps_by_tier?.essential || []).includes(s))
                .map((name) => ({ name, variant: 'neutral' })),
            ].slice(0, 8)}
          />
        </div>
      )}

      <div className="row" style={{ marginTop: '1rem' }}>
        <Link className="btn btn-primary btn-sm" to={`/careers/${encodeURIComponent(r.career)}`}>Explore career</Link>
        <Link className="btn btn-secondary btn-sm" to={`/careers/${encodeURIComponent(r.career)}/roadmap`}>View roadmap</Link>
        {r.skill_gaps?.[0] && (
          <Link className="btn btn-secondary btn-sm" to="/skills" state={{ skill: r.skill_gaps[0] }}>
            Verify {r.skill_gaps[0]}
          </Link>
        )}
      </div>

      <button
        type="button"
        className="btn btn-quiet btn-sm"
        style={{ marginTop: '0.7rem', padding: '0.2rem 0' }}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? 'Hide details' : 'Show more'}
        <Icon name="arrow" size={13} style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.14s ease' }} />
      </button>

      {expanded && (
        <div style={{ marginTop: '0.7rem' }}>
          {typeof r.rank_score === 'number' && Math.round(r.rank_score) !== Math.round(r.fit_score ?? r.confidence) && (
            <p className="hint" title="Fit score adjusted by a small, capped amount for job-market relevance and feedback calibration — this is what determines the order below, not the % fit number above.">
              Overall rank score: {Math.round(r.rank_score)}% (includes market/feedback adjustments)
            </p>
          )}
          {r.evidence_strength_label && (
            <p className="hint" title="How reliable the matched skill evidence is on average — separate from how many skills matched.">
              Evidence strength: {r.evidence_strength_label}
            </p>
          )}
          {r.market_outlook?.note && (
            <p className="hint">{r.market_outlook.note} — curated reference data, not a live feed or a personal prediction.</p>
          )}
          {r.live_market?.source === 'adzuna' && (
            <p className="hint">
              Live check: {r.live_market.postings_sample_count} matching postings found just now
              {r.live_market.salary_min && r.live_market.salary_max
                ? ` (observed range: ₹${r.live_market.salary_min.toLocaleString('en-IN')}–₹${r.live_market.salary_max.toLocaleString('en-IN')})`
                : ''}.
            </p>
          )}
          <FeedbackWidget recommendationId={r.id} />
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: history, loading: historyLoading, run: refreshHistory } = useAsync(api.recommendationHistory, []);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [results, setResults] = useState(null);
  const [usedSource, setUsedSource] = useState('profile');
  const [historyOpen, setHistoryOpen] = useState(false);
  // Guards the auto-generate effect below against firing more than once
  // for the same navigation — e.g. React 18 StrictMode double-invoking
  // effects in development, or any other double-mount. The backend's
  // per-user advisory lock (recommendationRepository.generateBatch) is
  // what actually guarantees at most one analysis run gets persisted
  // even so, but avoiding the duplicate request in the first place is
  // strictly better than relying on the server to collapse it after the
  // fact.
  const autoGenerateRan = useRef(false);

  // The exact { source, candidate } of the most recent generate attempt
  // — set unconditionally, BEFORE the request, success or failure. This
  // is what "Retry" replays. `usedSource` (below) is only updated on
  // SUCCESS and defaults to 'profile', so using it for retry would mean:
  // a resume_upload analysis that fails on the very first attempt
  // retries as source='profile' with the candidate dropped entirely —
  // silently switching to a completely different (and wrong) analysis.
  // See master prompt Phase 2 section C/D.
  const lastAttemptRef = useRef({ source: 'profile' });

  async function handleGenerate(opts = {}) {
    lastAttemptRef.current = opts;
    setGenerating(true);
    setGenError(null);
    try {
      const data = await api.generateRecommendations(5, opts);
      setResults(data);
      setUsedSource(opts.source || 'profile');
      refreshHistory();
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  // Arrived here from ResumePage's "Analyze career from this resume" /
  // "Use this for career analysis" actions — run that source
  // automatically once, then clear the navigation state so a page
  // refresh doesn't repeat it.
  useEffect(() => {
    if (autoGenerateRan.current) return;
    if (location.state?.source) {
      autoGenerateRan.current = true;
      handleGenerate({ source: location.state.source, candidate: location.state.candidate });
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Recommendations"
        description="Each score reflects how closely your profile's evidence lines up with what a career typically requires — an alignment estimate, not a prediction of hiring outcomes or job-market success."
        action={
          <div className="row">
            <button className="btn btn-primary" onClick={() => handleGenerate({ source: 'profile' })} disabled={generating}>
              {generating ? 'Analyzing…' : 'Use my profile'}
            </button>
            <Link className="btn btn-secondary" to="/resume">Use a resume instead</Link>
          </div>
        }
      />

      {genError && (
        <ErrorState
          error={{ message: genError }}
          onRetry={() => handleGenerate(lastAttemptRef.current)}
        />
      )}

      {generating && <LoadingState rows={4} label="Generating recommendations" />}

      {!generating && results && (
        <div className="stack" style={{ marginBottom: '2rem' }}>
          <p className="hint">Based on {SOURCE_LABELS[usedSource] || 'your profile'}.</p>
          {results.map((r, idx) => (
            <RecommendationCard key={r.id ?? r.career} r={r} rank={idx} />
          ))}
        </div>
      )}

      {!generating && !results && (
        <EmptyState
          icon="target"
          title="No recommendations generated yet"
          description="Generate recommendations from your profile, or from a resume, to see career matches."
        />
      )}

      {/* History is collapsible and lives below the fold — it is a
          reference log, not the point of the page. */}
      <details className="disclosure" open={historyOpen} onToggle={(e) => setHistoryOpen(e.target.open)}>
        <summary>History {history?.length ? `(${history.length})` : ''}</summary>
        <div style={{ paddingTop: '0.6rem' }}>
          {historyLoading && <LoadingState rows={3} />}
          {history && history.length === 0 && (
            <p className="hint">No past recommendations — generate your first set above.</p>
          )}
          {history && history.length > 0 && (
            <div className="card card-flush">
              <div className="list">
                {history.map((h) => (
                  <div key={h.id} className="list-row">
                    <div>
                      <Link to={`/careers/${encodeURIComponent(h.career_name)}`}><strong>{h.career_name}</strong></Link>
                      <div className="tiny">
                        {new Date(h.created_at).toLocaleString()}
                        {h.source && h.source !== 'profile' ? ` · from ${SOURCE_LABELS[h.source] || h.source}` : ''}
                      </div>
                    </div>
                    <span className="chip chip-matched">{h.match_score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
