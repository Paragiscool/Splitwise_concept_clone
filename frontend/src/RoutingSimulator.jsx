import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function RoutingSimulator() {
  const [clientMethod, setClientMethod] = useState('GET');
  const [clientPath, setClientPath] = useState('/groups/9/members');
  const [serverMethod, setServerMethod] = useState('GET');
  const [serverPath, setServerPath] = useState('/groups/{group_id}/members');
  const [useGuardClause, setUseGuardClause] = useState(false);
  
  const [simulationResult, setSimulationResult] = useState(null);
  
  const handleSimulate = () => {
    // Convert FastAPI parameterized path to a regex-like match
    // /groups/{group_id}/members -> /groups/9/members
    const normalizedServerPath = serverPath.replace('{group_id}', '9');
    
    let serverResponse = null;
    let statusCode = 200;
    
    // Simulate FastAPI strict trailing slash & method routing
    if (clientPath === normalizedServerPath && clientMethod === serverMethod) {
      statusCode = 200;
      serverResponse = [ { id: 1, name: "Alice" }, { id: 2, name: "Bob" } ];
    } else if (clientPath === normalizedServerPath && clientMethod !== serverMethod) {
      statusCode = 405;
      serverResponse = { detail: "Method Not Allowed" };
    } else if (clientPath !== normalizedServerPath) {
      // Simulate strict trailing slash missing/added
      if (clientPath + '/' === normalizedServerPath || clientPath === normalizedServerPath + '/') {
         // FastAPI usually redirects 307 for GET, but for POST or strict routers it can 405 or 404
         statusCode = 405; 
         serverResponse = { detail: "Method Not Allowed (Strict Slash Mismatch)" };
      } else {
         statusCode = 404;
         serverResponse = { detail: "Not Found" };
      }
    }

    // Simulate React processing the response blindly
    let reactRenderState = "Success";
    let renderError = null;
    let simulatedDom = null;

    try {
      if (useGuardClause) {
        // Defensive programming
        if (!Array.isArray(serverResponse)) {
          reactRenderState = "Handled Exception";
          simulatedDom = <p style={{color: '#ff5555'}}>Error: Expected array, got object. UI gracefully degraded.</p>;
        } else {
          simulatedDom = (
            <ul>
              {serverResponse.map(u => <li key={u.id}>{u.name}</li>)}
            </ul>
          );
        }
      } else {
        // Blind trust (The Bug)
        simulatedDom = (
          <ul>
            {serverResponse.map(u => <li key={u.id}>{u.name}</li>)}
          </ul>
        );
      }
    } catch (err) {
      reactRenderState = "CRASHED";
      renderError = err.message; // e.g. "serverResponse.map is not a function"
    }

    setSimulationResult({
      statusCode,
      serverResponse,
      reactRenderState,
      renderError,
      simulatedDom
    });
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="dashboard-header" style={{ marginBottom: '1rem' }}>
        <h2>Full-Stack Routing Sandbox</h2>
        <Link to="/dashboard" className="logout-btn" style={{ textDecoration: 'none' }}>Back</Link>
      </div>
      
      <p style={{ color: '#aaa', marginBottom: '2rem' }}>
        Simulate the exact cascading failure caused by trailing slash and HTTP method mismatches between React and FastAPI.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Backend Configuration */}
        <div className="group-card" style={{ borderColor: 'var(--primary)' }}>
          <h3 style={{ color: 'var(--primary)' }}>Backend Router (FastAPI)</h3>
          <div className="expense-form" style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>HTTP Method Configured</label>
            <select id="serverMethod" value={serverMethod} onChange={(e) => setServerMethod(e.target.value)}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="DELETE">DELETE</option>
            </select>
            
            <label style={{ display: 'block', margin: '1rem 0 0.5rem 0', color: '#ccc' }}>Route Path Configured</label>
            <select id="serverPath" value={serverPath} onChange={(e) => setServerPath(e.target.value)}>
              <option value="/groups/{group_id}/members">/groups/&#123;group_id&#125;/members (No Trailing Slash)</option>
              <option value="/groups/{group_id}/members/">/groups/&#123;group_id&#125;/members/ (Trailing Slash)</option>
            </select>
          </div>
        </div>

        {/* Frontend Configuration */}
        <div className="group-card" style={{ borderColor: '#4da6ff' }}>
          <h3 style={{ color: '#4da6ff' }}>Frontend Fetch (React)</h3>
          <div className="expense-form" style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Fetch Method</label>
            <select id="clientMethod" value={clientMethod} onChange={(e) => setClientMethod(e.target.value)}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="DELETE">DELETE</option>
            </select>
            
            <label style={{ display: 'block', margin: '1rem 0 0.5rem 0', color: '#ccc' }}>Requested URL</label>
            <select id="clientPath" value={clientPath} onChange={(e) => setClientPath(e.target.value)}>
              <option value="/groups/9/members">/groups/9/members (No Trailing Slash)</option>
              <option value="/groups/9/members/">/groups/9/members/ (Trailing Slash)</option>
            </select>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#ccc', cursor: 'pointer' }}>
              <input 
                id="guardClause"
                type="checkbox" 
                checked={useGuardClause} 
                onChange={(e) => setUseGuardClause(e.target.checked)} 
                style={{ width: 'auto' }}
              />
              Enable Guard Clause (Array.isArray)
            </label>
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <button 
          id="simulateBtn"
          onClick={handleSimulate}
          style={{ background: '#1cc29f', color: 'white', padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          Simulate Request 🚀
        </button>
      </div>
      
      {/* Simulation Results Box */}
      {simulationResult && (
        <div className="group-card" style={{ background: '#1e1e1e', borderColor: simulationResult.reactRenderState === 'CRASHED' ? '#ff5555' : '#1cc29f' }}>
          <h3 style={{ color: simulationResult.reactRenderState === 'CRASHED' ? '#ff5555' : '#1cc29f', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
            Simulation Timeline
          </h3>
          
          <div style={{ padding: '1rem 0' }}>
            <p><strong>1. Network Response (FastAPI):</strong></p>
            <div style={{ background: '#000', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', color: simulationResult.statusCode === 200 ? '#4da6ff' : '#ff5555' }}>
              HTTP {simulationResult.statusCode}<br/>
              {JSON.stringify(simulationResult.serverResponse, null, 2)}
            </div>
            
            <p style={{ marginTop: '1.5rem' }}><strong>2. React UI Rendering:</strong></p>
            {simulationResult.reactRenderState === 'CRASHED' ? (
              <div style={{ background: '#330000', border: '1px solid #ff5555', padding: '2rem', borderRadius: '4px', textAlign: 'center' }}>
                <h1 style={{ color: '#ff5555', fontSize: '2rem', margin: 0 }}>BLANK SCREEN CRASH</h1>
                <p style={{ color: '#ffa8a8', fontFamily: 'monospace', marginTop: '1rem' }}>
                  Uncaught TypeError: {simulationResult.renderError}
                </p>
                <p style={{ color: '#ccc', fontSize: '0.9rem', marginTop: '1rem' }}>
                  React attempted to run <code>.map()</code> on the FastAPI error dictionary. The component unmounted.
                </p>
              </div>
            ) : (
              <div style={{ background: '#002b18', border: '1px solid #1cc29f', padding: '2rem', borderRadius: '4px' }}>
                <h3 style={{ color: '#1cc29f', marginTop: 0 }}>Render Successful!</h3>
                <div style={{ background: '#000', padding: '1rem', borderRadius: '4px', color: '#fff' }}>
                  {simulationResult.simulatedDom}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoutingSimulator;
