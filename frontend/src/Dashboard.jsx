import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchUserGroups, createGroup } from './api';
import { Link } from 'react-router-dom';

function DashboardScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = () => {
    fetchUserGroups(user.id).then(setGroups);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await createGroup(newGroupName, user.id);
    setNewGroupName('');
    loadGroups();
  };

  if (!user) return <div style={{padding: '2rem'}}>Please log in...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Your Groups</h2>
        <form onSubmit={handleCreateGroup} className="create-group-form">
          <input 
            type="text" 
            placeholder="New group name..." 
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button type="submit">Create</button>
        </form>
      </div>

      <div className="groups-grid">
        {Array.isArray(groups) && groups.map(g => {
          const bal = g.net_balance || 0;
          const isOwed = bal > 0;
          const isOwing = bal < 0;
          const balColor = isOwed ? '#1cc29f' : isOwing ? '#ff5555' : 'var(--text-muted)';
          const balText = isOwed ? `owes you $${bal.toFixed(2)}` : isOwing ? `you owe $${Math.abs(bal).toFixed(2)}` : 'settled up';
          
          return (
            <Link to={`/group/${g.id}`} key={g.id} className="group-card">
              <h3>{g.name}</h3>
              <div style={{ color: balColor, fontWeight: 'bold', marginTop: '1rem' }}>
                {balText}
              </div>
              <div className="group-date" style={{marginTop: '0.5rem'}}>Created {new Date(g.created_at).toLocaleDateString()}</div>
            </Link>
          );
        })}
        {groups.length === 0 && <p className="empty-state">You are not in any groups yet.</p>}
      </div>
    </div>
  );
}

export default DashboardScreen;
