import Icon from './Icon';

// An empty screen is an invitation to act, not just a status message —
// every empty state should say what to do next, not merely that there's
// nothing here yet (master prompt: meaningful empty states).
export default function EmptyState({ title, description, action, icon = 'sparkle' }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={28} className="muted" />
      <h3 style={{ marginTop: '0.7rem' }}>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
