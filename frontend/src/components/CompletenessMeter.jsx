import { Link } from 'react-router-dom';

// A ring rather than a bar: this sits at the top of the Dashboard next
// to other round numbers (stat tiles), and a ring reads as "a portion of
// a whole" more immediately than a horizontal bar does at small sizes.
function Ring({ percent, size = 76 }) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const color = percent >= 80 ? 'var(--accent)' : percent >= 40 ? 'var(--signal)' : 'var(--danger)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="completeness-ring" role="img" aria-label={`${percent}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-heading)" fontWeight="700" fontSize="17" fill="var(--ink)">
        {percent}%
      </text>
    </svg>
  );
}

export default function CompletenessMeter({ percent, missing = [] }) {
  return (
    <div className="completeness">
      <Ring percent={percent} />
      <div className="completeness-body">
        {percent >= 100 ? (
          <p className="hint">Your profile has everything recommendations use.</p>
        ) : (
          <>
            <p className="hint">{missing.length} thing{missing.length === 1 ? '' : 's'} would sharpen your recommendations.</p>
            <div className="completeness-missing">
              {missing.slice(0, 3).map((field) => (
                <div className="completeness-missing-item" key={field.key}>
                  <span className="muted">{field.action}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <Link to="/profile" className="btn btn-secondary btn-sm" style={{ marginTop: '0.8rem' }}>
          {percent >= 100 ? 'Review profile' : 'Complete profile'}
        </Link>
      </div>
    </div>
  );
}