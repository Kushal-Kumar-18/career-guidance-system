export default function StatTile({ label, value, size = 'lg' }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile-label">{label}</span>
      <span className={`stat-tile-value${size === 'sm' ? ' stat-tile-value-sm' : ''}`}>{value}</span>
    </div>
  );
}
