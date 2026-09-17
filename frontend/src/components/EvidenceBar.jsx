// The signature element: makes the fit score legible by showing what
// it's made of, rather than presenting a bare percentage. Built entirely
// from real matched/verified/gap skill lists — never a fabricated
// breakdown - see lib/profile.js buildEvidence().
export default function EvidenceBar({ evidence, compact = false }) {
  const { verified, selfReported, missing, verifiedPct, selfReportedPct, missingPct } = evidence;

  if (!evidence.total) return null;

  return (
    <div>
      <div className="evidence-bar" role="img" aria-label={
        `${verified.length} verified skills, ${selfReported.length} self-reported skills, ${missing.length} missing`
      }>
        {verifiedPct > 0 && <span className="evidence-verified" style={{ width: `${verifiedPct}%` }} />}
        {selfReportedPct > 0 && <span className="evidence-matched" style={{ width: `${selfReportedPct}%` }} />}
        {missingPct > 0 && <span className="evidence-gap" style={{ width: `${missingPct}%` }} />}
      </div>
      {!compact && (
        <div className="evidence-legend">
          <span><span className="dot dot-verified" /> {verified.length} verified</span>
          <span><span className="dot dot-matched" /> {selfReported.length} self-reported</span>
          <span><span className="dot dot-gap" /> {missing.length} to build</span>
        </div>
      )}
    </div>
  );
}
