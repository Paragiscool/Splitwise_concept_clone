import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { fetchGroupExpenses, createExpense, fetchUsers, fetchGroupDebts, createSettlement, removeGroupMember, fetchGroupMembers, addGroupMember } from './api';

function GroupDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  
  // Expense Form State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [strategy, setStrategy] = useState('equal');
  
  // Settle Form State
  const [settlePayee, setSettlePayee] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  useEffect(() => {
    loadData();
    fetchUsers().then(setUsers);
  }, [id]);

  const loadData = () => {
    fetchGroupExpenses(id).then(setExpenses);
    fetchGroupDebts(id).then(setDebts);
    fetchGroupMembers(id).then(setMembers);
  };

  const getUserName = (uid) => {
    const u = users.find(u => u.id === uid);
    return u ? u.name : `User ${uid}`;
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const participantIds = members.map(m => m.id);
    
    const payload = {
      description: desc,
      amount: parseFloat(amount),
      payer_id: user.id,
      strategy: strategy,
      participants: participantIds
    };

    try {
      await createExpense(id, payload);
      setShowAddModal(false);
      setDesc('');
      setAmount('');
      loadData();
    } catch (err) {
      alert("Failed to add expense: " + err.message);
    }
  };

  const handleSettleUp = async (e) => {
    e.preventDefault();
    if (!settlePayee || !settleAmount) return;

    const payload = {
      payer_id: user.id,
      payee_id: parseInt(settlePayee),
      amount: parseFloat(settleAmount)
    };

    try {
      await createSettlement(id, payload);
      setShowSettleModal(false);
      setSettlePayee('');
      setSettleAmount('');
      loadData();
    } catch (err) {
      alert("Failed to settle up: " + err.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (userId === user.id) {
      alert("You cannot remove yourself from the group.");
      return;
    }
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    try {
      await removeGroupMember(id, userId);
      alert("Member removed successfully.");
      loadData();
    } catch (err) {
      alert("Failed to remove member: " + err.message);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteUserId) return;
    try {
      await addGroupMember(id, inviteUserId);
      setShowInviteModal(false);
      setInviteUserId('');
      loadData();
    } catch (err) {
      alert("Failed to invite member: " + err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Group Dashboard</h2>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button onClick={() => setShowAddModal(true)} style={{background: 'var(--primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>
            Add Expense
          </button>
          <button onClick={() => setShowSettleModal(true)} className="logout-btn" style={{borderColor: '#1cc29f', color: '#1cc29f'}}>
            Settle Up
          </button>
        </div>
      </div>

      {debts.length > 0 && (
        <div className="group-card" style={{marginBottom: '2rem', borderColor: 'var(--primary)'}}>
          <h3 style={{color: 'var(--primary)'}}>Suggested Repayments</h3>
          {debts.map((d, i) => (
            <div key={i} style={{padding: '0.5rem 0', borderBottom: i === debts.length-1 ? 'none' : '1px solid #333'}}>
              <strong>{getUserName(d.payer)}</strong> should pay <strong>{getUserName(d.payee)}</strong> <span style={{color: '#ff5555', fontWeight: 'bold'}}>${d.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{marginTop: 0, color: 'var(--primary)'}}>Add an Expense</h3>
            <form onSubmit={handleAddExpense} className="expense-form">
              <input type="text" placeholder="Description (e.g. Dinner)" value={desc} onChange={e => setDesc(e.target.value)} required />
              <input type="number" step="0.01" placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} required />
              <select value={strategy} onChange={e => setStrategy(e.target.value)}>
                <option value="equal">Split Equally</option>
                <option value="percentage">Split by Percentage</option>
                <option value="custom">Custom Split</option>
              </select>
              <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                <button type="submit" style={{background: 'var(--primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Save Expense</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="logout-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSettleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{marginTop: 0, color: '#1cc29f'}}>Settle Up</h3>
            <form onSubmit={handleSettleUp} className="expense-form">
              <select value={settlePayee} onChange={e => setSettlePayee(e.target.value)} required>
                <option value="">Select who you are paying...</option>
                {members.filter(m => m.id !== user.id).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <input type="number" step="0.01" placeholder="Amount ($)" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} required />
              <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                <button type="submit" style={{background: '#1cc29f', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Record Payment</button>
                <button type="button" onClick={() => setShowSettleModal(false)} className="logout-btn" style={{borderColor: '#1cc29f', color: '#1cc29f'}}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="expense-feed">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h3 style={{margin: 0}}>Group Members</h3>
          <button onClick={() => setShowInviteModal(true)} style={{background: 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer'}}>+ Invite</button>
        </div>
        <div className="group-card" style={{marginBottom: '2rem'}}>
          {members.map(m => (
            <div key={m.id} style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #333'}}>
              <span>{m.name}</span>
              <button onClick={() => handleRemoveMember(m.id)} style={{background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: '0.9rem'}}>Remove</button>
            </div>
          ))}
        </div>

        {showInviteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{marginTop: 0, color: 'var(--primary)'}}>Invite Member</h3>
              <form onSubmit={handleInviteMember} className="expense-form">
                <select value={inviteUserId} onChange={e => setInviteUserId(e.target.value)} required>
                  <option value="">Select user to invite...</option>
                  {users.filter(u => !members.find(m => m.id === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                  <button type="submit" style={{background: 'var(--primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Add Member</button>
                  <button type="button" onClick={() => setShowInviteModal(false)} className="logout-btn">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <h3>Recent Expenses</h3>
        {expenses.length === 0 && <p className="empty-state">No expenses yet. Add one to get started!</p>}
        {expenses.map(exp => (
          <Link to={`/expense/${exp.id}`} key={exp.id} className="group-card" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', textDecoration: 'none', color: 'inherit'}}>
            <div>
              <h4 style={{margin: '0 0 0.5rem 0'}}>{exp.description}</h4>
              <div className="group-date">{new Date(exp.created_at).toLocaleString()}</div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem'}}>${exp.amount.toFixed(2)}</div>
              <div className="group-date">Paid by {exp.payer_id === user.id ? 'You' : getUserName(exp.payer_id)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default GroupDetails;
