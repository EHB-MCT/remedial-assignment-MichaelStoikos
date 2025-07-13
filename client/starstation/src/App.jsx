import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

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
      <div className="app">
        <header className="game-header">
          <h1>🚀 StarStation</h1>
          <p>Welcome, {user.username}!</p>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </header>
        <main className="game-main">
          <div className="game-content">
            <h2>🎮 Game Interface Coming Soon!</h2>
            <p>Your game will be built here. You're logged in as: {user.username}</p>
            <p>User ID: {user.userId}</p>
          </div>
        </main>
      </div>
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

export default App
