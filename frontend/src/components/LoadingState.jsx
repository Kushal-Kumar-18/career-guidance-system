export default function LoadingState({ label = 'Loading', rows = 3 }) {
  return (
    <div aria-busy="true" aria-label={label} className="stack-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 18, width: `${92 - i * 9}%` }} />
      ))}
    </div>
  );
}
