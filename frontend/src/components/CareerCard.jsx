import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function CareerCard({ career, footer, onSelect, selected }) {
  const Wrapper = onSelect ? 'button' : 'div';

  return (
    <Wrapper
      className="card career-card"
      type={onSelect ? 'button' : undefined}
      onClick={onSelect}
      aria-pressed={onSelect ? Boolean(selected) : undefined}
      data-selected={selected || undefined}
    >
      <div className="row-between" style={{ marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>
          {onSelect ? career.name : <Link to={`/careers/${encodeURIComponent(career.name)}`}>{career.name}</Link>}
        </h3>
        {selected && <Icon name="check" size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
      </div>
      <div className="row" style={{ marginBottom: '0.6rem' }}>
        {career.salary_range && <span className="chip chip-neutral">{career.salary_range}</span>}
        {career.job_growth && <span className="chip chip-matched">Growth: {career.job_growth}</span>}
      </div>
      {career.skills && career.skills.length > 0 && (
        <div className="chip-set">
          {career.skills.slice(0, 5).map((s) => (
            <span key={s} className="chip chip-neutral">{s}</span>
          ))}
          {career.skills.length > 5 && (
            <span className="chip chip-neutral">+{career.skills.length - 5} more</span>
          )}
        </div>
      )}
      {footer}
    </Wrapper>
  );
}
