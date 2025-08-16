import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import './App.css'
import ResourceDisplay from './components/Resources/ResourceDisplay'
import BuildingsTab from './components/Buildings/BuildingsTab'
import EventsDisplay from './components/events/EventsDisplay'

/**
 * App Component
 * 
 * Main React application component that handles authentication and routing.
 * Manages user login/registration and renders the game interface when authenticated.
 * 
 * @returns {JSX.Element} The rendered application interface
 */
function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  /**
   * useEffect hook that checks for existing user session on component mount.
   * 
   * - Retrieves saved user data from localStorage.
   * - Automatically logs in user if valid session exists.
   * - Runs only once when component mounts.
   */
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  /**
   * Handles form submission for both login and registration.
   * 
   * - Prevents default form submission behavior.
   * - Sets loading state during API calls.
   * - Sends request to appropriate endpoint (login or register).
   * - Stores user data in localStorage on successful authentication.
   * - Handles errors gracefully with user feedback.
   * - Automatically logs in user after successful registration.
   * 
   * @param {Event} e - Form submission event
   */
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

  /**
   * Logs out the current user and clears session data.
   * 
   * - Removes user from component state.
   * - Clears user data from localStorage.
   * - Returns user to login/register screen.
   */
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

/**
 * GameInterface Component
 * 
 * Main game interface component that displays after user authentication.
 * Provides navigation between different game sections (Resources, Buildings, Events).
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - User object containing userId and username
 * @param {Function} props.onLogout - Callback function to handle user logout
 * @returns {JSX.Element} The rendered game interface with navigation
 */
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
        <Link 
          to="/events" 
          className={`nav-tab ${location.pathname === '/events' ? 'active' : ''}`}
        >
          🌌 Events
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
          <Route 
            path="/events" 
            element={
              <div className="game-content">
                <h2>🌌 Space Events</h2>
                <p>Experience dynamic space phenomena that affect your colony!</p>
                <EventsDisplay 
                  userId={user.userId} 
                  onEventTriggered={() => {
                    if (resourceRefresh) {
                      resourceRefresh.refresh();
                    }
                  }}
                />
              </div>
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

export default App
