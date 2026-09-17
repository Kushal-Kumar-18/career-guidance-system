import Icon from './Icon';

// Errors state what happened and how to fix it — no apology, no vague
// "something went wrong" without a next step.
export default function ErrorState({ error, onRetry }) {
  return (
    <div className="banner banner-error" role="alert" style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
      <Icon name="alert" size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
      <div style={{ flex: 1 }}>
        <div>{error?.message || 'That request failed.'}</div>
        {onRetry && (
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.6rem' }} onClick={onRetry}>
            <Icon name="refresh" size={14} /> Try again
          </button>
        )}
      </div>
    </div>
  );
}
