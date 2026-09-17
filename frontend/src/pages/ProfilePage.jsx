import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { profileCompleteness } from '../lib/profile';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import CompletenessMeter from '../components/CompletenessMeter';
import Icon from '../components/Icon';

const EMPTY = {
  education: '',
  skills: '',
  interests: '',
  experience_years: 0,
  certifications: '',
  projects: '',
  preferred_location: '',
  salary_expectation: '',
};

// Each section is its own card with its own save state so a long form
// doesn't read as one undifferentiated wall of fields (master prompt:
// clearer sections for education, skills, interests, experience,
// certifications, projects).
function Field({ id, label, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

export default function ProfilePage() {
  const { data, loading, error, run } = useAsync(api.getProfile, []);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (data?.profile) setForm({ ...EMPTY, ...data.profile });
  }, [data]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await api.updateProfile(form);
      setSaved(true);
      run();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState rows={6} />;
  if (error) return <ErrorState error={error} onRetry={run} />;

  const completeness = profileCompleteness(data?.profile);

  return (
    <div>
      <PageHeader
        title="Your profile"
        description="This is what powers your recommendations, skill-gap analysis, and resume — the more detail, the sharper the results."
      />

      <div className="stack">
        <div className="card">
          <div className="section-head"><h2>Completeness</h2></div>
          <CompletenessMeter percent={completeness.percent} missing={completeness.missing} />
        </div>

        <form className="card" onSubmit={handleSubmit}>
          {saveError && <div className="banner banner-error" role="alert">{saveError}</div>}
          {saved && <div className="banner banner-success">Profile saved.</div>}

          <div className="section-head"><h2>Education &amp; experience</h2></div>
          <div className="field-row">
            <Field id="education" label="Education">
              <input id="education" value={form.education || ''} onChange={(e) => update('education', e.target.value)} placeholder="B.Tech Computer Science" />
            </Field>
            <Field id="experience_years" label="Years of experience">
              <input id="experience_years" type="number" min="0" value={form.experience_years ?? 0} onChange={(e) => update('experience_years', Number(e.target.value))} />
            </Field>
          </div>

          <hr className="divider" />

          <div className="section-head"><h2>Skills &amp; interests</h2></div>
          <Field id="skills" label="Skills" hint="Comma-separated. Matched against career skill vocabularies, and what your skill assessments confirm.">
            <textarea id="skills" rows={2} value={form.skills || ''} onChange={(e) => update('skills', e.target.value)} placeholder="python, sql, react, communication" />
          </Field>
          <Field id="interests" label="Interests" hint="Comma-separated.">
            <input id="interests" value={form.interests || ''} onChange={(e) => update('interests', e.target.value)} placeholder="data, design, working with people" />
          </Field>

          <hr className="divider" />

          <div className="section-head"><h2>Certifications &amp; projects</h2></div>
          <Field id="certifications" label="Certifications" hint="Comma-separated.">
            <input id="certifications" value={form.certifications || ''} onChange={(e) => update('certifications', e.target.value)} placeholder="AWS Certified, PMP" />
          </Field>
          <Field id="projects" label="Projects" hint="This also feeds skill extraction.">
            <textarea id="projects" rows={3} value={form.projects || ''} onChange={(e) => update('projects', e.target.value)} placeholder="Describe a project or two." />
          </Field>

          <hr className="divider" />

          <div className="section-head"><h2>Location &amp; expectations</h2></div>
          <div className="field-row">
            <Field id="preferred_location" label="Preferred location">
              <input id="preferred_location" value={form.preferred_location || ''} onChange={(e) => update('preferred_location', e.target.value)} />
            </Field>
            <Field id="salary_expectation" label="Salary expectation">
              <input id="salary_expectation" value={form.salary_expectation || ''} onChange={(e) => update('salary_expectation', e.target.value)} />
            </Field>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: '0.4rem' }}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>

        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Icon name="upload" size={22} style={{ color: 'var(--verified)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>Have a resume already?</h3>
            <p className="hint" style={{ marginTop: '0.25rem' }}>Upload it and merge what we find into this profile instead of typing it all in again.</p>
          </div>
          <Link className="btn btn-secondary btn-sm" to="/resume">Upload resume</Link>
        </div>
      </div>
    </div>
  );
}
