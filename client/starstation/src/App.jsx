import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import './App.css'
import ResourceDisplay from './components/resources/ResourceDisplay'
import BuildingsTab from './components/buildings/BuildingsTab'

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const response = await axios.post(`http://localhost:5000${endpoint}`, {
        username,
        password
      })

      if (isLogin) {
        // Login successful
        const userData = {
          userId: response.data.userId,
          username: response.data.username
        }
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } else {
        // Registration successful, now log them in
        const userData = {
          userId: response.data.userId,
          username: username
        }
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      }
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  // If user is logged in, show game interface
  if (user) {
    return (
      <Router>
        <GameInterface user={user} onLogout={handleLogout} />
      </Router>
    )
  }

  // Login/Register form
  return (
    <div className="app">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>🚀 StarStation</h1>
            <p>Space Colony Resource Management</p>
          </div>
          
          <div className="auth-tabs">
            <button 
              className={`tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={`tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// Game Interface Component with Navigation
const GameInterface = ({ user, onLogout }) => {
  const location = useLocation();
  const [resourceRefresh, setResourceRefresh] = useState(null);

  return (
    <div className="app">
      <header className="game-header">
        <h1>🚀 StarStation</h1>
        <p>Welcome, {user.username}!</p>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>
      
      <nav className="game-nav">
        <Link 
          to="/" 
          className={`nav-tab ${location.pathname === '/' ? 'active' : ''}`}
        >
          📊 Resources
        </Link>
        <Link 
          to="/buildings" 
          className={`nav-tab ${location.pathname === '/buildings' ? 'active' : ''}`}
        >
          🏗️ Buildings
        </Link>
      </nav>

      <main className="game-main">
        <Routes>
          <Route 
            path="/" 
            element={
              <div className="game-content">
                <h2>🌌 Space Colony Resource Management</h2>
                <p>Manage your resources and expand your colony!</p>
                <ResourceDisplay userId={user.userId} onRef={setResourceRefresh} />
              </div>
            } 
          />
          <Route 
            path="/buildings" 
            element={
              <BuildingsTab 
                userId={user.userId} 
                onResourcesUpdate={() => {
                  if (resourceRefresh) {
                    resourceRefresh.refresh();
                  }
                }}
              />
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

export default App
