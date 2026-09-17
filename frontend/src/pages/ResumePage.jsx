import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { describeMerge } from '../lib/profile';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';

const EMPTY = { phone: '', summary: '', institution: '', graduation_year: '', experience: [] };

// Fields carried by the "review an uploaded resume" form — a plain
// object of comma-separated strings for the list-y fields, matching
// the exact convention ProfilePage uses for skills/interests/
// certifications, so this feels like the rest of the app rather than a
// bolted-on flow.
const EMPTY_REVIEW = {
  education: '',
  skills: '',
  interests: '',
  certifications: '',
  projects: '',
  experience_years: 0,
};

export default function ResumePage() {
  const navigate = useNavigate();
  const { data: resume, loading } = useAsync(api.getResume, []);
  const { data: profileData, run: refreshProfile } = useAsync(api.getProfile, []);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [targetCareer, setTargetCareer] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    if (resume) setForm({ ...EMPTY, ...resume, experience: resume.experience_json || [] });
  }, [resume]);

  // Release the generated PDF's blob: URL when leaving the page — it
  // holds the file in memory until revoked.
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  function updateExperience(idx, field, value) {
    setForm((f) => {
      const experience = [...f.experience];
      experience[idx] = { ...experience[idx], [field]: value };
      return { ...f, experience };
    });
  }

  function addExperience() {
    setForm((f) => ({ ...f, experience: [...f.experience, { title: '', company: '', duration: '', description: '' }] }));
  }

  function removeExperience(idx) {
    setForm((f) => ({ ...f, experience: f.experience.filter((_, i) => i !== idx) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.updateResume(form);
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
    setGenerating(true);
    setError(null);
    try {
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
        interests: (ex.interests || []).join(', '),
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
  function analyzeFromReviewedResume() {
    navigate('/recommendations', { state: { source: 'merge', candidate: review } });
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
      <PageHeader title="Resume & ATS check" description="Build a resume from your profile, then score it against a target role's keyword expectations." />

      {error && <div className="banner banner-error" role="alert">{error}</div>}

      <div className="stack">
        <form className="card" onSubmit={handleSave}>
          <div className="section-head"><h2>Resume details</h2></div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" value={form.phone || ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="summary">Summary</label>
            <textarea id="summary" rows={3} value={form.summary || ''} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="institution">Institution</label>
              <input id="institution" value={form.institution || ''} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="grad_year">Graduation year</label>
              <input id="grad_year" value={form.graduation_year || ''} onChange={(e) => setForm((f) => ({ ...f, graduation_year: e.target.value }))} />
            </div>
          </div>

          <h3 style={{ marginTop: '1rem' }}>Experience</h3>
          <div className="stack-sm">
            {form.experience.map((exp, idx) => (
              <div key={idx} className="card" style={{ background: 'var(--surface-sunk)' }}>
                <div className="field-row">
                  <div className="field">
                    <label>Title</label>
                    <input value={exp.title || ''} onChange={(e) => updateExperience(idx, 'title', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Company</label>
                    <input value={exp.company || ''} onChange={(e) => updateExperience(idx, 'company', e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Duration</label>
                  <input value={exp.duration || ''} onChange={(e) => updateExperience(idx, 'duration', e.target.value)} placeholder="Jun 2023 - Aug 2023" />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea rows={2} value={exp.description || ''} onChange={(e) => updateExperience(idx, 'description', e.target.value)} />
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeExperience(idx)}>Remove</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addExperience} style={{ marginTop: '0.8rem' }}>
            <Icon name="plus" size={14} /> Add experience
          </button>

          <div className="row" style={{ marginTop: '1.2rem' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save resume'}</button>
            <button type="button" className="btn btn-secondary" onClick={handleGeneratePdf} disabled={generating}>
              {generating ? 'Generating…' : 'Generate PDF'}
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
                <label htmlFor="rev_interests">Interests</label>
                <input id="rev_interests" value={review.interests} onChange={(e) => updateReview('interests', e.target.value)} />
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