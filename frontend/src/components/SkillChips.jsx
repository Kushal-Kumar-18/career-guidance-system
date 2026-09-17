import Icon from './Icon';

// Renders a set of skill chips. `variant` picks a single colour for the
// whole set (for career-detail pages that just list required skills);
// pass `items` instead of `skills` when different chips in the same row
// need different variants (matched vs. gap vs. verified together) - see
// RecommendationsPage's evidence section.
const VARIANT_CLASS = {
  neutral: 'chip-neutral',
  matched: 'chip-matched',
  verified: 'chip-verified',
  gap: 'chip-gap',
  danger: 'chip-danger',
};

export default function SkillChips({ skills = [], items, variant = 'neutral', emptyLabel = 'None yet' }) {
  const resolved = items || skills.map((name) => ({ name, variant }));

  if (!resolved.length) {
    return <span className="tiny">{emptyLabel}</span>;
  }

  return (
    <div className="chip-set">
      {resolved.map((item) => (
        <span key={item.name} className={`chip ${VARIANT_CLASS[item.variant] || 'chip-neutral'}`}>
          {item.variant === 'verified' && <Icon name="check" size={12} />}
          {item.name}
        </span>
      ))}
    </div>
  );
}
