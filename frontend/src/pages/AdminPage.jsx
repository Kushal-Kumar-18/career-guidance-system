import { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import StatTile from '../components/StatTile';

// Ports the original app's admin.html: system-wide stats + a user table
// with delete. Route itself is gated by role in App.jsx, and every call
// here also hits admin-only backend endpoints (requireAdmin middleware),
// so there's no path to this data without a real admin JWT either way.
export default function AdminPage() {
  const { user } = useAuth();
  const { data: overview, loading: overviewLoading, error: overviewError, run: runOverview } = useAsync(api.adminOverview, []);
  const { data: users, loading: usersLoading, error: usersError, run: runUsers, setData: setUsers } = useAsync(api.adminListUsers, []);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function handleDelete(id, username) {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    setActionError(null);
    setDeletingId(id);
    try {
      await api.adminDeleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader title="System overview" description="Aggregate stats and user management. Visible to admin accounts only." />

      {overviewLoading && <LoadingState rows={4} />}
      {overviewError && <ErrorState error={overviewError} onRetry={runOverview} />}

      {overview && (
        <div className="grid-auto" style={{ marginBottom: '1.6rem' }}>
          <div className="card"><StatTile label="Total users" value={overview.total_users} size="sm" /></div>
          <div className="card"><StatTile label="Profiles completed" value={overview.profiles_completed} size="sm" /></div>
          <div className="card"><StatTile label="Active today" value={overview.active_today} size="sm" /></div>
          <div className="card"><StatTile label="Recommendations generated" value={overview.total_recommendations_generated} size="sm" /></div>
          <div className="card"><StatTile label="Skill tests completed" value={overview.total_skill_tests_completed} size="sm" /></div>
          <div className="card"><StatTile label="Simulations played" value={overview.total_games_played} size="sm" /></div>
          <div className="card"><StatTile label="Real job postings cached" value={overview.real_job_postings_cached ?? overview.total_job_postings_cached} size="sm" /></div>
        </div>
      )}

      {overview?.top_recommended_careers?.length > 0 && (
        <div className="card" style={{ marginBottom: '1.6rem' }}>
          <div className="section-head"><h3>Most recommended careers</h3></div>
          <div className="stack-sm">
            {overview.top_recommended_careers.map((c) => (
              <div key={c.career_name} className="row-between" style={{ fontSize: '0.9rem' }}>
                <span>{c.career_name}</span>
                <span className="muted">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-head"><h3>Users</h3></div>
        {actionError && <div className="banner banner-error" role="alert">{actionError}</div>}
        {usersLoading && <LoadingState rows={4} />}
        {usersError && <ErrorState error={usersError} onRetry={runUsers} />}
        {users && users.length > 0 && (
          <div className="table-wrap">
            <table className="data" style={{ minWidth: 560 }}>
              <thead>
                <tr>{['Username', 'Email', 'Role', 'Joined', 'Last login', ''].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className={`chip ${u.role === 'admin' ? 'chip-verified' : 'chip-neutral'}`}>{u.role}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={deletingId === u.id || String(u.id) === String(user?.id)}
                        onClick={() => handleDelete(u.id, u.username)}
                        title={String(u.id) === String(user?.id) ? "You can't delete your own account" : 'Delete user'}
                      >
                        {deletingId === u.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
