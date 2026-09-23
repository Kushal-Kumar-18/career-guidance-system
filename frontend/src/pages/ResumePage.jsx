import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { describeMerge, parseList, dedupeSkills } from '../lib/profile';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';

// ---------------------------------------------------------------------
// Repeatable-section entry factories. Each entry gets a client-only
// `id` (never sent anywhere meaningful — the backend doesn't key off
// it) purely so React can track/remove a specific card and inputs keep
// focus while typing. Loading existing data merges it onto these
// defaults (see withIds below) so older, narrower-shaped saved entries
// (e.g. pre-upgrade experience rows with only title/company/duration)
// still populate every field the new form expects.
// ---------------------------------------------------------------------
let idSeq = 0;
function makeId() {
  idSeq += 1;
  return `entry_${Date.now()}_${idSeq}`;
}

const emptyEducation = () => ({ id: makeId(), degree: '', field: '', institution: '', start_year: '', end_year: '', grade: '', coursework: '' });
const emptyInternship = () => ({ id: makeId(), role: '', company: '', location: '', start_date: '', end_date: '', description: '', technologies: '' });
const emptyExperience = () => ({ id: makeId(), title: '', company: '', location: '', start_date: '', end_date: '', duration: '', description: '', technologies: '' });
const emptyProject = () => ({ id: makeId(), name: '', description: '', technologies: '', features: '', github_url: '', demo_url: '' });
const emptyCertification = () => ({ id: makeId(), name: '', organization: '', date: '', credential_id: '', credential_url: '' });

function withIds(list, factory) {
  return (list || []).map((item) => ({ ...factory(), ...item, id: item.id || makeId() }));
}

// True if `value` has no real content once surrounding whitespace is
// stripped — covers '', null, undefined, and whitespace-only strings.
function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

// A repeatable entry (one education/internship/experience/project/
// certification card) counts as content only if some field OTHER than
// its client-only `id` is filled in — an entry that's just `{ id: ... }`
// (e.g. an "Add" click with nothing typed yet) is not meaningful.
function entryHasContent(entry) {
  return Object.entries(entry || {}).some(([key, value]) => key !== 'id' && !isBlank(value));
}

// Whether the form has any real resume content at all — used to block
// saving/generating a PDF from a fully empty (just-cleared) draft.
// Checks every field in EMPTY_FORM; array fields count as content if
// any entry in them has content (see entryHasContent).
function hasResumeContent(form) {
  const textFields = [
    'full_name', 'email', 'headline', 'phone', 'location',
    'linkedin_url', 'github_url', 'portfolio_url', 'summary',
  ];
  if (textFields.some((key) => !isBlank(form[key]))) return true;

  const entryListFields = ['education', 'internships', 'experience', 'projects', 'certifications'];
  return entryListFields.some((key) => (form[key] || []).some(entryHasContent));
}

const EMPTY_FORM = {
  full_name: '',
  email: '',
  headline: '',
  phone: '',
  location: '',
  linkedin_url: '',
  github_url: '',
  portfolio_url: '',
  summary: '',
  education: [],
  internships: [],
  experience: [],
  projects: [],
  certifications: [],
};

// Fields carried by the "review an uploaded resume" form — a plain
// object of comma-separated strings for the list-y fields, matching
// the exact convention ProfilePage uses for skills/certifications, so
// this feels like the rest of the app rather than a bolted-on flow.
const EMPTY_REVIEW = {
  education: '',
  skills: '',
  certifications: '',
  projects: '',
  experience_years: 0,
};

function Field({ id, label, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

// One repeatable-entry card: a title row with a Remove control, and
// whatever fields the caller renders inside.
function EntryCard({ title, onRemove, children }) {
  return (
    <div className="card" style={{ background: 'var(--surface-sunk)' }}>
      <div className="row-between" style={{ marginBottom: '0.7rem' }}>
        <strong>{title}</strong>
        <button type="button" className="btn btn-quiet btn-sm" onClick={onRemove}>
          <Icon name="close" size={13} /> Remove
        </button>
      </div>
      <div className="stack-sm">{children}</div>
    </div>
  );
}

// Generic wrapper for the five repeatable sections (Education,
// Internships, Experience, Projects, Certifications) — same
// add/edit/remove shell, different fields per section (passed as
// `renderFields`).
function RepeatableSection({ heading, hint, entries, onUpdate, onAdd, onRemove, addLabel, entryTitle, renderFields }) {
  return (
    <>
      <div className="section-head"><h2>{heading}</h2></div>
      {hint && <p className="hint" style={{ marginTop: 0 }}>{hint}</p>}
      {entries.length === 0 && (
        <p className="hint">Nothing added yet.</p>
      )}
      <div className="stack-sm">
        {entries.map((entry, idx) => (
          <EntryCard key={entry.id} title={entryTitle(entry, idx)} onRemove={() => onRemove(entry.id)}>
            {renderFields(entry, (field, value) => onUpdate(entry.id, field, value))}
          </EntryCard>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onAdd} style={{ marginTop: '0.8rem' }}>
        <Icon name="plus" size={14} /> {addLabel}
      </button>
    </>
  );
}

export default function ResumePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: resume, loading } = useAsync(api.getResume, []);
  const { data: profileData, run: refreshProfile } = useAsync(api.getProfile, []);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [targetCareer, setTargetCareer] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set by "Clear Resume" so that a GET /api/resume response which was
  // already in flight when the user clicked Clear doesn't repopulate
  // the form right after it's cleared. Cleared again once the user
  // explicitly saves (see handleSave/handleGeneratePdf) — at that
  // point the freshly saved resume should load normally like any other
  // save. Component-local and in-memory only: navigating away and back
  // remounts the component with a fresh ref, so the saved resume loads
  // normally again.
  const clearedRef = useRef(false);

  // --- Skills (section 4) — deliberately NOT a separate data system:
  // these chips read from and write straight to the existing
  // profiles.skills field via the existing PUT /api/profile endpoint,
  // the same one ProfilePage's Skills field uses. Each add/remove
  // saves immediately so the chip list always reflects what's
  // actually on the profile. ---
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [skillsSaving, setSkillsSaving] = useState(false);
  const [skillsError, setSkillsError] = useState(null);

  // --- Upload-and-review state (Source B of the candidate pipeline) ---
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadWarnings, setUploadWarnings] = useState([]);
  const [review, setReview] = useState(null); // null until a file has been parsed
  const [applyOverwrite, setApplyOverwrite] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState(null);

  useEffect(() => {
    // If the form was just cleared with "Clear Resume", stay empty
    // until the user explicitly saves again — this skips applying a
    // `resume` value that arrives (e.g. from a GET /api/resume that was
    // still in flight) after the user has already cleared the form.
    if (clearedRef.current) return;
    if (resume) {
      setForm({
        full_name: resume.full_name || '',
        email: resume.email || '',
        headline: resume.headline || '',
        phone: resume.phone || '',
        location: resume.location || '',
        linkedin_url: resume.linkedin_url || '',
        github_url: resume.github_url || '',
        portfolio_url: resume.portfolio_url || '',
        summary: resume.summary || '',
        education: withIds(resume.education_json, emptyEducation),
        internships: withIds(resume.internships_json, emptyInternship),
        experience: withIds(resume.experience_json, emptyExperience),
        projects: withIds(resume.projects_json, emptyProject),
        certifications: withIds(resume.certifications_json, emptyCertification),
      });
    }
  }, [resume]);

  useEffect(() => {
    if (profileData?.profile) setSkills(dedupeSkills(parseList(profileData.profile.skills)));
  }, [profileData]);

  // Release the generated PDF's blob: URL when leaving the page — it
  // holds the file in memory until revoked.
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  // Shared add/update/remove helpers for the five repeatable sections —
  // `key` is the form field name ('education', 'internships', etc).
  function updateEntry(key, id, field, value) {
    setForm((f) => ({ ...f, [key]: f[key].map((e) => (e.id === id ? { ...e, [field]: value } : e)) }));
    setSaved(false);
  }
  function addEntry(key, factory) {
    setForm((f) => ({ ...f, [key]: [...f[key], factory()] }));
    setSaved(false);
  }
  function removeEntry(key, id) {
    setForm((f) => ({ ...f, [key]: f[key].filter((e) => e.id !== id) }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    if (!hasResumeContent(form)) {
      setError('Your resume is empty. Add some information before saving.');
      return;
    }
    setSaving(true);
    try {
      await api.updateResume(form);
      // A real save supersedes the "cleared" state — the just-saved
      // resume should load normally rather than staying suppressed.
      clearedRef.current = false;
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // The PDF is served by the authenticated GET /api/resume/download
  // route (it is no longer a public /files/... static path), so we
  // can't just drop the returned URL into an <a href> — that request
  // would carry no Bearer token. Instead we fetch the bytes with the
  // token attached and turn them into a local blob: URL for the link.
  async function handleGeneratePdf() {
    setError(null);
    if (!hasResumeContent(form)) {
      setError('Your resume is empty. Add some information before saving.');
      return;
    }
    setGenerating(true);
    try {
      // Save first so the generated PDF reflects whatever is currently
      // in the form, not the last-saved version.
      await api.updateResume(form);
      // This save supersedes the "cleared" state the same way an
      // explicit "Save resume" does — do this as soon as the save
      // succeeds, regardless of whether PDF generation/download below
      // subsequently fails.
      clearedRef.current = false;
      await api.generateResumePdf();
      const objectUrl = await api.downloadResumePdf();
      setPdfUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return objectUrl;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  // Clears only the *unsaved, client-side* Resume Builder state: the
  // on-screen form (back to EMPTY_FORM), the locally-generated PDF
  // preview link, and the upload/review panel (parsed extraction,
  // warnings, apply-to-profile status). It never calls a delete/update
  // API, so the saved resume row, the profile, any uploaded files, ATS
  // results, and recommendations all remain untouched — reloading the
  // page (or navigating away and back) still shows whatever was last
  // actually saved with "Save resume". Confirmed first since it
  // discards whatever is currently typed but not yet saved.
  function handleClearResume() {
    const confirmed = window.confirm(
      "Clear this form? This clears what you're currently editing here — the resume builder fields, the generated PDF preview, and the upload/review panel. Your saved resume, profile, uploads, and ATS results are not affected."
    );
    if (!confirmed) return;

    setForm(EMPTY_FORM);
    setSaved(false);
    setError(null);
    setPdfUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });

    // Remember, for this component instance only, that the form was
    // explicitly cleared, so a resume-load effect that resolves after
    // this point doesn't repopulate it. The saved resume itself is
    // untouched; navigating away and back mounts a fresh component
    // (with clearedRef reset to false), so the saved resume loads
    // normally again.
    clearedRef.current = true;

    // Upload/review panel — in-memory only; doesn't touch the uploaded
    // file, the saved profile, or anything already applied to it.
    setUploadError(null);
    setUploadWarnings([]);
    setReview(null);
    setApplyOverwrite(false);
    setApplying(false);
    setApplied(false);
    setApplyError(null);
  }

  async function handleAtsCheck(e) {
    e.preventDefault();
    if (!targetCareer.trim()) return;
    setAtsLoading(true);
    setError(null);
    try {
      const result = await api.analyzeAts(targetCareer.trim());
      setAtsResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAtsLoading(false);
    }
  }

  // Source C: the Resume Builder's own structured data, sent straight
  // to the recommendation pipeline — no PDF round-trip.
  function analyzeFromResumeBuilder() {
    navigate('/recommendations', { state: { source: 'resume_builder' } });
  }

  // --- Skills chip handlers — persist to the existing profile system
  // immediately on every add/remove. ---
  async function persistSkills(next) {
    setSkillsSaving(true);
    setSkillsError(null);
    try {
      await api.updateProfile({ skills: next.join(', ') });
      refreshProfile();
    } catch (err) {
      setSkillsError(err.message);
    } finally {
      setSkillsSaving(false);
    }
  }

  function addSkill(e) {
    e?.preventDefault();
    const value = skillInput.trim();
    if (!value) return;
    const next = dedupeSkills([...skills, value]);
    setSkills(next);
    setSkillInput('');
    persistSkills(next);
  }

  function removeSkill(name) {
    const next = skills.filter((s) => s.toLowerCase() !== name.toLowerCase());
    setSkills(next);
    persistSkills(next);
  }

  // Source B: parse an uploaded PDF/DOCX. Nothing is saved by this
  // call — the result is only ever shown for review below.
  async function handleUploadChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setReview(null);
    setApplied(false);
    setApplyError(null);
    try {
      const result = await api.uploadResume(file);
      setUploadWarnings(result.warnings || []);
      const ex = result.extracted || {};
      setReview({
        education: ex.education || '',
        skills: (ex.skills || []).join(', '),
        certifications: (ex.certifications || []).join(', '),
        projects: ex.projects || '',
        experience_years: ex.experience_years_guess ?? 0,
      });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function updateReview(field, value) {
    setReview((r) => ({ ...(r || EMPTY_REVIEW), [field]: value }));
    setApplied(false);
  }

  // The reviewed fields ARE the canonical candidate profile at this
  // point (comma-separated strings, same shape ProfilePage uses).
  //
  // IMPORTANT: this must send source: 'resume_upload', NOT 'merge'.
  // "Analyze career from this resume" is the resume-only analysis
  // action — there is no "merge with my existing profile" choice on
  // this button, unlike the separate "Apply to my profile" action
  // below. Sending 'merge' here (as this used to do) makes the backend
  // union this resume's skills with whatever is already sitting in the
  // user's saved profile (candidateProfileService.merge is additive —
  // it never replaces, only adds), so a brand-new, substantially
  // different resume would keep inheriting skills/domain evidence from
  // an entirely unrelated earlier resume the user had previously
  // applied to their profile. That cross-contamination is exactly what
  // 'resume_upload' avoids: it analyzes ONLY the reviewed resume, with
  // nothing from the stored profile mixed in.
  function analyzeFromReviewedResume() {
    navigate('/recommendations', { state: { source: 'resume_upload', candidate: review } });
  }

  // "Apply to my profile": sends the reviewed extraction to the
  // dedicated POST /profile/apply-resume endpoint, which does the same
  // union-of-skills / keep-existing-text-unless-blank merge server-side
  // (candidateProfileService.merge) -- one canonical place for this
  // logic instead of duplicating it here, and it's what
  // candidate-pipeline.test.js actually exercises. `applyOverwrite`
  // maps straight onto the endpoint's mode: 'merge' | 'overwrite'.
  // After applying, the profile is re-fetched so completeness/skill
  // pages reflect it immediately, and every future recommendation call
  // (which reads from the profile by default) automatically picks it
  // up too.
  async function applyToProfile() {
    if (!review) return;
    setApplying(true);
    setApplyError(null);
    try {
      await api.applyResumeToProfile(review, applyOverwrite ? 'overwrite' : 'merge');
      await refreshProfile();
      setApplied(true);
    } catch (err) {
      setApplyError(err.message);
    } finally {
      setApplying(false);
    }
  }

  const mergePreview = review ? describeMerge(profileData?.profile, review) : null;

  if (loading) return <LoadingState rows={6} />;

  return (
    <div>
      <PageHeader
        title="Resume Builder"
        description="Build a polished, ATS-friendly resume section by section, then generate a recruiter-ready PDF."
      />

      {error && <div className="banner banner-error" role="alert">{error}</div>}

      <div className="stack">
        <form className="card" onSubmit={handleSave}>
          {/* 1. Personal Information */}
          <div className="section-head"><h2>Personal Information</h2></div>
          <div className="field-row">
            <Field id="full_name" label="Full name">
              <input id="full_name" value={form.full_name} onChange={(e) => updateField('full_name', e.target.value)} placeholder={user?.username || 'Your name'} />
            </Field>
            <Field id="email" label="Email">
              <input id="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder='abc@gmail.com' />
            </Field>
          </div>
          <div className="field-row">
            <Field id="phone" label="Phone">
              <input id="phone" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+91 98765 43210" />
            </Field>
            <Field id="location" label="Location">
              <input id="location" value={form.location} onChange={(e) => updateField('location', e.target.value)} placeholder="Bengaluru, Karnataka" />
            </Field>
          </div>
          <Field id="headline" label="Professional headline" hint='A one-line title, e.g. "Full Stack Developer | Data Engineer".'>
            <input id="headline" value={form.headline} onChange={(e) => updateField('headline', e.target.value)} />
          </Field>
          <div className="field-row">
            <Field id="linkedin_url" label="LinkedIn">
              <input id="linkedin_url" value={form.linkedin_url} onChange={(e) => updateField('linkedin_url', e.target.value)} placeholder="linkedin.com/in/username" />
            </Field>
            <Field id="github_url" label="GitHub">
              <input id="github_url" value={form.github_url} onChange={(e) => updateField('github_url', e.target.value)} placeholder="github.com/username" />
            </Field>
          </div>
          <Field id="portfolio_url" label="Portfolio / website" hint="Optional.">
            <input id="portfolio_url" value={form.portfolio_url} onChange={(e) => updateField('portfolio_url', e.target.value)} placeholder="yourname.dev" />
          </Field>

          <hr className="divider" />

          {/* 2. Professional Summary */}
          <div className="section-head"><h2>Professional Summary</h2></div>
          <Field id="summary" label="Summary" hint="A few sentences on who you are and what you're looking for.">
            <textarea id="summary" rows={4} value={form.summary} onChange={(e) => updateField('summary', e.target.value)} />
          </Field>

          <hr className="divider" />

          {/* 3. Education */}
          <RepeatableSection
            heading="Education"
            entries={form.education}
            onUpdate={(id, field, value) => updateEntry('education', id, field, value)}
            onAdd={() => addEntry('education', emptyEducation)}
            onRemove={(id) => removeEntry('education', id)}
            addLabel="Add education"
            entryTitle={(entry) => entry.degree || entry.institution || 'Education entry'}
            renderFields={(entry, set) => (
              <>
                <div className="field-row">
                  <Field label="Degree / program">
                    <input value={entry.degree} onChange={(e) => set('degree', e.target.value)} placeholder="B.Tech, MCA, ..." />
                  </Field>
                  <Field label="Field / specialization">
                    <input value={entry.field} onChange={(e) => set('field', e.target.value)} placeholder="Computer Science" />
                  </Field>
                </div>
                <Field label="Institution">
                  <input value={entry.institution} onChange={(e) => set('institution', e.target.value)} />
                </Field>
                <div className="field-row">
                  <Field label="Start year">
                    <input value={entry.start_year} onChange={(e) => set('start_year', e.target.value)} placeholder="2022" />
                  </Field>
                  <Field label="End year">
                    <input value={entry.end_year} onChange={(e) => set('end_year', e.target.value)} placeholder="2026" />
                  </Field>
                </div>
                <div className="field-row">
                  <Field label="CGPA / percentage">
                    <input value={entry.grade} onChange={(e) => set('grade', e.target.value)} placeholder="8.9 CGPA or 85%" />
                  </Field>
                  <Field label="Relevant coursework" hint="Optional, comma-separated.">
                    <input value={entry.coursework} onChange={(e) => set('coursework', e.target.value)} />
                  </Field>
                </div>
              </>
            )}
          />

          <hr className="divider" />

          {/* 4. Skills — reuses the existing profile skills field/endpoint */}
          <div className="section-head"><h2>Skills</h2></div>
          <p className="hint" style={{ marginTop: 0 }}>
            Programming languages, frameworks/libraries, databases, tools/platforms, and any other relevant skills.
            {skillsSaving && ' Saving…'}
          </p>
          {skillsError && <div className="banner banner-error" role="alert">{skillsError}</div>}
          <div className="chip-set" style={{ marginBottom: '0.7rem' }}>
            {skills.length === 0 && <span className="hint">No skills added yet.</span>}
            {skills.map((s) => (
              <span key={s} className="chip chip-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                {s}
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  aria-label={`Remove ${s}`}
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', display: 'flex' }}
                >
                  <Icon name="close" size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="row">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addSkill(e); }}
              placeholder="e.g. Python, React, PostgreSQL"
              style={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.65rem 0.75rem',
                boxSizing: 'border-box'
              }}
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={addSkill}>
              <Icon name="plus" size={14} /> Add skill
            </button>
          </div>

          <hr className="divider" />

          {/* 5. Internships */}
          <RepeatableSection
            heading="Internships"
            entries={form.internships}
            onUpdate={(id, field, value) => updateEntry('internships', id, field, value)}
            onAdd={() => addEntry('internships', emptyInternship)}
            onRemove={(id) => removeEntry('internships', id)}
            addLabel="Add internship"
            entryTitle={(entry) => [entry.role, entry.company].filter(Boolean).join(' at ') || 'Internship entry'}
            renderFields={(entry, set) => (
              <>
                <div className="field-row">
                  <Field label="Role">
                    <input value={entry.role} onChange={(e) => set('role', e.target.value)} />
                  </Field>
                  <Field label="Company">
                    <input value={entry.company} onChange={(e) => set('company', e.target.value)} />
                  </Field>
                </div>
                <div className="field-row">
                  <Field label="Location">
                    <input value={entry.location} onChange={(e) => set('location', e.target.value)} />
                  </Field>
                  <Field label="Dates">
                    <div className="row">
                      <input value={entry.start_date} onChange={(e) => set('start_date', e.target.value)} placeholder="Jun 2025" style={{ flex: 1 }} />
                      <input value={entry.end_date} onChange={(e) => set('end_date', e.target.value)} placeholder="Aug 2025" style={{ flex: 1 }} />
                    </div>
                  </Field>
                </div>
                <Field label="Description" hint="Responsibilities and achievements — one per line becomes a bullet.">
                  <textarea rows={3} value={entry.description} onChange={(e) => set('description', e.target.value)} />
                </Field>
                <Field label="Technologies / skills" hint="Comma-separated.">
                  <input value={entry.technologies} onChange={(e) => set('technologies', e.target.value)} />
                </Field>
              </>
            )}
          />

          <hr className="divider" />

          {/* 6. Experience */}
          <RepeatableSection
            heading="Experience"
            entries={form.experience}
            onUpdate={(id, field, value) => updateEntry('experience', id, field, value)}
            onAdd={() => addEntry('experience', emptyExperience)}
            onRemove={(id) => removeEntry('experience', id)}
            addLabel="Add experience"
            entryTitle={(entry) => [entry.title, entry.company].filter(Boolean).join(' at ') || 'Experience entry'}
            renderFields={(entry, set) => (
              <>
                <div className="field-row">
                  <Field label="Job title">
                    <input value={entry.title} onChange={(e) => set('title', e.target.value)} />
                  </Field>
                  <Field label="Company">
                    <input value={entry.company} onChange={(e) => set('company', e.target.value)} />
                  </Field>
                </div>
                <div className="field-row">
                  <Field label="Location">
                    <input value={entry.location} onChange={(e) => set('location', e.target.value)} />
                  </Field>
                  <Field label="Dates">
                    <div className="row">
                      <input value={entry.start_date} onChange={(e) => set('start_date', e.target.value)} placeholder="Jan 2025" style={{ flex: 1 }} />
                      <input value={entry.end_date} onChange={(e) => set('end_date', e.target.value)} placeholder="Present" style={{ flex: 1 }} />
                    </div>
                  </Field>
                </div>
                <Field label="Responsibilities / achievements" hint="One per line becomes a bullet.">
                  <textarea rows={3} value={entry.description} onChange={(e) => set('description', e.target.value)} />
                </Field>
                <Field label="Technologies / skills" hint="Comma-separated.">
                  <input value={entry.technologies} onChange={(e) => set('technologies', e.target.value)} />
                </Field>
              </>
            )}
          />

          <hr className="divider" />

          {/* 7. Projects */}
          <RepeatableSection
            heading="Projects"
            entries={form.projects}
            onUpdate={(id, field, value) => updateEntry('projects', id, field, value)}
            onAdd={() => addEntry('projects', emptyProject)}
            onRemove={(id) => removeEntry('projects', id)}
            addLabel="Add project"
            entryTitle={(entry) => entry.name || 'Project entry'}
            renderFields={(entry, set) => (
              <>
                <Field label="Project name">
                  <input value={entry.name} onChange={(e) => set('name', e.target.value)} />
                </Field>
                <Field label="Description">
                  <textarea rows={2} value={entry.description} onChange={(e) => set('description', e.target.value)} />
                </Field>
                <Field label="Key features / contribution" hint="One per line becomes a bullet.">
                  <textarea rows={2} value={entry.features} onChange={(e) => set('features', e.target.value)} />
                </Field>
                <Field label="Technologies / skills" hint="Comma-separated.">
                  <input value={entry.technologies} onChange={(e) => set('technologies', e.target.value)} />
                </Field>
                <div className="field-row">
                  <Field label="GitHub URL">
                    <input value={entry.github_url} onChange={(e) => set('github_url', e.target.value)} placeholder="github.com/you/project" />
                  </Field>
                  <Field label="Live / demo URL">
                    <input value={entry.demo_url} onChange={(e) => set('demo_url', e.target.value)} />
                  </Field>
                </div>
              </>
            )}
          />

          <hr className="divider" />

          {/* 8. Certifications */}
          <RepeatableSection
            heading="Certifications"
            entries={form.certifications}
            onUpdate={(id, field, value) => updateEntry('certifications', id, field, value)}
            onAdd={() => addEntry('certifications', emptyCertification)}
            onRemove={(id) => removeEntry('certifications', id)}
            addLabel="Add certification"
            entryTitle={(entry) => entry.name || 'Certification entry'}
            renderFields={(entry, set) => (
              <>
                <div className="field-row">
                  <Field label="Certification name">
                    <input value={entry.name} onChange={(e) => set('name', e.target.value)} />
                  </Field>
                  <Field label="Organization">
                    <input value={entry.organization} onChange={(e) => set('organization', e.target.value)} />
                  </Field>
                </div>
                <div className="field-row">
                  <Field label="Date">
                    <input value={entry.date} onChange={(e) => set('date', e.target.value)} placeholder="2025" />
                  </Field>
                  <Field label="Credential ID">
                    <input value={entry.credential_id} onChange={(e) => set('credential_id', e.target.value)} />
                  </Field>
                </div>
                <Field label="Credential URL">
                  <input value={entry.credential_url} onChange={(e) => set('credential_url', e.target.value)} />
                </Field>
              </>
            )}
          />

          {saved && <div className="banner banner-success" style={{ marginTop: '1.2rem' }}>Resume saved.</div>}
          <div className="row" style={{ marginTop: '1.2rem' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save resume'}</button>
            <button type="button" className="btn btn-secondary" onClick={handleGeneratePdf} disabled={generating}>
              {generating ? 'Generating…' : 'Generate PDF'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleClearResume}>
              Clear Resume
            </button>
            <button type="button" className="btn btn-secondary" onClick={analyzeFromResumeBuilder}>
              Analyze career from this resume
            </button>
          </div>
          {pdfUrl && (
            <p style={{ marginTop: '0.8rem' }}>
              <a href={pdfUrl} download="resume.pdf" target="_blank" rel="noreferrer">Download your resume PDF</a>
            </p>
          )}
        </form>

        {/* 9. Existing Resume Upload */}
        <div className="card">
          <div className="section-head"><h2>Upload an existing resume</h2></div>
          <p className="hint">Upload a PDF or Word (.docx) file and we'll pull out your skills, education, and experience for you to review.</p>

          {uploadError && <div className="banner banner-error" role="alert">{uploadError}</div>}

          <div className="field" style={{ maxWidth: 420 }}>
            <label htmlFor="resume_file">Resume file (PDF or DOCX, up to 5&nbsp;MB)</label>
            <input id="resume_file" type="file" accept=".pdf,.docx" onChange={handleUploadChange} disabled={uploading} />
          </div>
          {uploading && <LoadingState label="Reading your resume" rows={2} />}

          {review && (
            <div style={{ marginTop: '1.1rem' }}>
              {uploadWarnings.length > 0 && (
                <ul className="hint" style={{ marginTop: 0, paddingLeft: '1.1rem' }}>
                  {uploadWarnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
              <h3>Review what we found — edit anything before using it</h3>

              <div className="field">
                <label htmlFor="rev_education">Education</label>
                <input id="rev_education" value={review.education} onChange={(e) => updateReview('education', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="rev_skills">Skills</label>
                <textarea id="rev_skills" rows={2} value={review.skills} onChange={(e) => updateReview('skills', e.target.value)} />
                <div className="field-hint">Comma-separated.</div>
              </div>
              <div className="field">
                <label htmlFor="rev_certifications">Certifications</label>
                <input id="rev_certifications" value={review.certifications} onChange={(e) => updateReview('certifications', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="rev_projects">Projects</label>
                <textarea id="rev_projects" rows={2} value={review.projects} onChange={(e) => updateReview('projects', e.target.value)} />
              </div>
              <div className="field" style={{ maxWidth: 220 }}>
                <label htmlFor="rev_experience_years">Years of experience</label>
                <input
                  id="rev_experience_years"
                  type="number"
                  min="0"
                  value={review.experience_years}
                  onChange={(e) => updateReview('experience_years', Number(e.target.value))}
                />
                <div className="field-hint">Guessed from dates in your resume — please confirm.</div>
              </div>

              <hr className="divider" />

              <h4>Apply to my profile</h4>
              {mergePreview && (mergePreview.newSkills.length > 0 || mergePreview.fields.length > 0) && !applyOverwrite && (
                <p className="hint">
                  This will add {mergePreview.newSkills.length} new skill{mergePreview.newSkills.length === 1 ? '' : 's'}
                  {mergePreview.fields.length > 0 ? ` and fill in ${mergePreview.fields.join(', ')}` : ''} to your existing
                  profile. Nothing you already have will be removed.
                </p>
              )}
              {mergePreview && mergePreview.newSkills.length === 0 && mergePreview.fields.length === 0 && !applyOverwrite && (
                <p className="hint">Nothing new here beyond what's already on your profile.</p>
              )}

              <label className="check" style={{ marginBottom: '0.8rem' }}>
                <input type="checkbox" checked={applyOverwrite} onChange={(e) => { setApplyOverwrite(e.target.checked); setApplied(false); }} />
                Replace my profile fields with this resume instead of merging
              </label>

              {applyError && <div className="banner banner-error" role="alert">{applyError}</div>}
              {applied && <div className="banner banner-success">Applied to your profile.</div>}

              <div className="row">
                <button className="btn btn-primary btn-sm" type="button" onClick={applyToProfile} disabled={applying}>
                  {applying ? 'Applying…' : 'Apply to my profile'}
                </button>
                <button className="btn btn-secondary btn-sm" type="button" onClick={analyzeFromReviewedResume}>
                  Analyze career from this resume
                </button>
              </div>

              {applied && (
                <div className="row" style={{ marginTop: '0.8rem' }}>
                  <span className="hint">Next:</span>
                  <Link to="/profile" className="btn btn-quiet btn-sm">Update profile further</Link>
                  <Link to="/recommendations" className="btn btn-quiet btn-sm">Get recommendations</Link>
                </div>
              )}
            </div>
          )}
        </div>

        <form className="card" onSubmit={handleAtsCheck}>
          <div className="section-head"><h2>ATS score check</h2></div>
          <div className="field" style={{ maxWidth: 320 }}>
            <label htmlFor="target_career">Target career</label>
            <input id="target_career" value={targetCareer} onChange={(e) => setTargetCareer(e.target.value)} placeholder="e.g. Data Scientist" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={atsLoading}>
            {atsLoading ? 'Analyzing…' : 'Check ATS score'}
          </button>

          {atsResult && (
            <div style={{ marginTop: '1.2rem' }}>
              <div className="score score-lg">{atsResult.ats_score}<span className="score-unit">/100</span></div>
              <h4 style={{ marginTop: '0.9rem' }}>Recommendations</h4>
              <ul style={{ marginTop: '0.3rem' }}>
                {atsResult.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}