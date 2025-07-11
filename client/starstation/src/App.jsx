import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch all tests from the backend
    const fetchTests = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Fetching tests from API...')
        const response = await axios.get('http://localhost:5000/api/tests')
        console.log('API Response:', response.data)
        console.log('Response type:', typeof response.data)
        console.log('Is array?', Array.isArray(response.data))
        setTests(response.data)
      } catch (error) {
        console.error('Error fetching tests:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTests()
  }, [])

  if (error) {
    return <div className="app"><h1>Error: {error}</h1></div>
  }

  return (
    <div className="app">
      <h1>Tests Collection</h1>
      {tests.length === 0 ? (
        <p>No tests found in the database.</p>
      ) : (
        <ul>
          {tests.map((test, index) => {
            console.log(`Test ${index}:`, test)
            return (
              <li key={test._id || index}>
                <strong>ID:</strong> {test._id || 'No ID'} <strong>Name:</strong> {test.name || 'No Name'}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default App
