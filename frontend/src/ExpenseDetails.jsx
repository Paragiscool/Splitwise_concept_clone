import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { fetchUsers } from './api';

const WS_URL = "ws://localhost:8000";
const API_URL = "http://localhost:8000";

function ExpenseDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [users, setUsers] = useState([]);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUsers().then(setUsers);
    
    // Fetch History
    fetch(`${API_URL}/expenses/${id}/chat`)
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error("Failed to load history", err));

    // Connect WebSocket
    ws.current = new WebSocket(`${WS_URL}/ws/expenses/${id}`);
    
    ws.current.onmessage = (event) => {
      const newMsg = JSON.parse(event.data);
      setMessages(prev => [...prev, newMsg]);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getUserName = (uid) => {
    const u = users.find(u => u.id === uid);
    return u ? u.name : `User ${uid}`;
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !ws.current) return;
    
    const payload = {
      user_id: user.id,
      content: inputValue
    };
    
    ws.current.send(JSON.stringify(payload));
    setInputValue('');
  };

  return (
    <div className="dashboard-container" style={{maxWidth: '800px'}}>
      <div className="dashboard-header">
        <Link to={`/dashboard`} className="logout-btn" style={{borderColor: '#fff', color: '#fff', marginRight: '1rem'}}>
          &larr; Back
        </Link>
        <h2>Expense Chat</h2>
      </div>

      <div className="group-card" style={{height: '60vh', display: 'flex', flexDirection: 'column'}}>
        <div style={{flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {messages.length === 0 && <p className="empty-state">No messages yet. Start the conversation!</p>}
          {messages.map(m => {
            const isMe = m.user_id === user.id;
            return (
              <div key={m.id} style={{alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%'}}>
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textAlign: isMe ? 'right' : 'left'}}>
                  {isMe ? 'You' : getUserName(m.user_id)} • {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div style={{
                  background: isMe ? 'var(--primary)' : '#333',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  borderBottomRightRadius: isMe ? '2px' : '12px',
                  borderBottomLeftRadius: !isMe ? '2px' : '12px',
                  color: 'white',
                  wordBreak: 'break-word'
                }}>
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={sendMessage} style={{display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem'}}>
          <input 
            type="text" 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type a message..." 
            style={{flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid #444', background: '#222', color: 'white'}}
          />
          <button type="submit" style={{background: 'var(--primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ExpenseDetails;
