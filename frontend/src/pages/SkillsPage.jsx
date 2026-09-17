import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { classifyProfileSkills, skillKey } from '../lib/profile';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';

function SkillRow({ skill, onTest, testing }) {
  return (
    <div className="list-row">
      <div className="row" style={{ gap: '0.6rem' }}>
        <span style={{ fontWeight: 500 }}>{skill.name}</span>
        {skill.verified ? (
          <span className="chip chip-verified"><Icon name="check" size={12} /> Verified · {skill.percentage}%</span>
        ) : (
          <span className="chip chip-neutral">Self-reported</span>
        )}
      </div>
      <button className="btn btn-secondary btn-sm" onClick={() => onTest(skill.name)} disabled={testing === skill.name}>
        {testing === skill.name ? 'Starting…' : skill.verified ? 'Retake' : 'Take assessment'}
      </button>
    </div>
  );
}

export default function SkillsPage() {
  const location = useLocation();
  const { data: profileData } = useAsync(api.getProfile, []);
  const { data: history } = useAsync(api.recommendationHistory, []);
  const { data: results, run: refreshResults } = useAsync(api.skillTestResults, []);

  const [skillInput, setSkillInput] = useState('');
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [genError, setGenError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [testingSkill, setTestingSkill] = useState(null);

  const breakdown = useMemo(
    () => classifyProfileSkills(profileData?.profile, results || []),
    [profileData, results]
  );

  // "Skills that matter to your current recommendations": the gaps from
  // the most recent recommendation run, deduplicated against what's
  // already verified. This is real gap data from recommendation_history,
  // not a generic top-skills list.
  const recommendedToVerify = useMemo(() => {
    const latest = history?.[0];
    if (!latest?.skill_gaps?.length) return [];
    const verifiedKeys = new Set(breakdown.verified.map((s) => skillKey(s.name)));
    return latest.skill_gaps.filter((g) => !verifiedKeys.has(skillKey(g))).slice(0, 5);
  }, [history, breakdown]);

  async function startTest(name) {
    if (!name?.trim()) return;
    setTestingSkill(name);
    setGenerating(true);
    setGenError(null);
    setSubmitResult(null);
    setAnswers({});
    try {
      const data = await api.generateSkillTest(name.trim(), 'intermediate', 5);
      setTest(data);
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  // Arrived from a recommendation card's "Verify {skill}" action —
  // prefill rather than auto-submit, since starting a test is an action
  // the person should take deliberately.
  useEffect(() => {
    if (location.state?.skill) setSkillInput(location.state.skill);
  }, [location.state]);

  async function submitTest() {
    setSubmitting(true);
    try {
      const orderedAnswers = test.questions.map((q) => answers[q.id]);
      const result = await api.submitSkillTest(test.test.id, orderedAnswers);
      setSubmitResult(result);
      refreshResults();
    } catch (err) {
      setGenError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setTest(null);
    setSubmitResult(null);
    setSkillInput('');
    setTestingSkill(null);
  }

  const allAnswered = test && test.questions.every((q) => answers[q.id] !== undefined);

  return (
    <div>
      <PageHeader
        title="Skill assessments"
        description="Take a short quiz on any skill to earn a verified proficiency level. Verified skills count as stronger evidence than self-reported ones in your recommendations and skill-gap analysis."
      />

      {!test && (
        <div className="stack">
          {recommendedToVerify.length > 0 && (
            <div className="card">
              <div className="section-head"><h3>Worth verifying next</h3></div>
              <p className="hint">These are gaps from your most recent recommendations — verifying them strengthens or corrects that match.</p>
              <div className="chip-set" style={{ marginTop: '0.6rem' }}>
                {recommendedToVerify.map((name) => (
                  <button key={name} type="button" className="btn btn-secondary btn-sm" onClick={() => startTest(name)}>
                    Verify {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="section-head"><h3>Your profile skills</h3></div>
            {breakdown.all.length ? (
              <div className="list">
                {breakdown.all.map((s) => (
                  <SkillRow key={s.name} skill={s} onTest={startTest} testing={testingSkill} />
                ))}
              </div>
            ) : (
              <p className="hint">No skills on your profile yet — add some on your <Link to="/profile">profile page</Link>, or test any skill below.</p>
            )}
            {breakdown.verifiedNotOnProfile.length > 0 && (
              <>
                <div className="section-head" style={{ marginTop: '1rem' }}>
                  <h4 style={{ margin: 0 }}>Verified, not yet on your profile</h4>
                </div>
                <div className="list">
                  {breakdown.verifiedNotOnProfile.map((s) => (
                    <div key={s.name} className="list-row">
                      <span className="chip chip-verified"><Icon name="check" size={12} /> {s.name} · {s.percentage}%</span>
                      <span className="tiny">Add it to your profile to use it in matching</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="section-head"><h3>Test any other skill</h3></div>
            <form
              onSubmit={(e) => { e.preventDefault(); startTest(skillInput); }}
              className="row"
              style={{ alignItems: 'flex-end' }}
            >
              <div className="field" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
                <label htmlFor="skill">Skill to test</label>
                <input id="skill" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="e.g. python, react, sql, communication" />
              </div>
              <button className="btn btn-primary" type="submit" disabled={generating}>
                {generating ? 'Building quiz…' : 'Start test'}
              </button>
            </form>
          </div>
        </div>
      )}

      {genError && <ErrorState error={{ message: genError }} />}

      {test && !submitResult && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>{test.test.skill_name} &middot; {test.test.difficulty}</h3>
          <div className="stack">
            {test.questions.map((q, idx) => (
              <div key={q.id}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{idx + 1}. {q.question_text}</div>
                <div className="stack-sm">
                  {q.options.map((opt, optIdx) => (
                    <label key={optIdx} className="check">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id] === optIdx}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: optIdx }))}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={submitTest} disabled={!allAnswered || submitting} style={{ marginTop: '1.1rem' }}>
            {submitting ? 'Submitting…' : 'Submit answers'}
          </button>
        </div>
      )}

      {submitResult && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="row-between">
            <div>
              <span className="tiny">Result</span>
              <div className="score score-lg" style={{ marginTop: '0.2rem' }}>
                {submitResult.result.percentage}<span className="score-unit">%</span>
              </div>
              <p className="hint">{submitResult.result.proficiency_level} · {submitResult.result.score} of {test.questions.length} correct</p>
            </div>
            <span className="chip chip-verified"><Icon name="check" size={13} /> Verified</span>
          </div>
          <div className="row" style={{ marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => startTest(test.test.skill_name)}>Retake</button>
            <button className="btn btn-primary" onClick={reset}>Test another skill</button>
          </div>
        </div>
      )}

      {generating && !test && <LoadingState rows={2} label="Building your quiz" />}
    </div>
  );
}
