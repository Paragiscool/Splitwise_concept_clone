import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { fetchUsers } from './api';
import DashboardScreen from './Dashboard';
import GroupDetails from './GroupDetails';
import ExpenseDetails from './ExpenseDetails';
import RoutingSimulator from './RoutingSimulator';
import './index.css';

function LoginScreen() {
  const [users, setUsers] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  const handleLogin = (user) => {
    login(user);
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome to Splitwise</h1>
        <p>Select your profile to continue</p>
        <div className="user-list">
          {users.map(u => (
            <button key={u.id} onClick={() => handleLogin(u)} className="user-btn">
              Log in as {u.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


function Navigation() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [globalUsers, setGlobalUsers] = useState([]);
  
  useEffect(() => {
    fetchUsers().then(setGlobalUsers);
  }, []);

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-brand">Splitwise</div>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/simulator">Simulator</Link>
        <select 
          value={user.id} 
          onChange={(e) => {
            const newUser = globalUsers.find(u => u.id === parseInt(e.target.value));
            if (newUser) login(newUser);
          }}
          style={{padding: '0.25rem', borderRadius: '4px', border: '1px solid #ddd'}}
        >
          {globalUsers.map(u => (
            <option key={u.id} value={u.id}>Profile: {u.name}</option>
          ))}
        </select>
        <button onClick={() => { logout(); navigate('/'); }} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/simulator" element={<RoutingSimulator />} />
          <Route path="/group/:id" element={<GroupDetails />} />
          <Route path="/expense/:id" element={<ExpenseDetails />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
