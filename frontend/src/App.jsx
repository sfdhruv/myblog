import React, { useState, useEffect } from 'react'
import axios from 'axios'

// Use absolute URL for API calls
const API_BASE_URL = 'http://localhost:5000/api'

function App() {
  const [posts, setPosts] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [backendStatus, setBackendStatus] = useState('checking')

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection()
    fetchPosts()
  }, [])

  const checkBackendConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`)
      setBackendStatus('connected')
      setError('')
    } catch (error) {
      setBackendStatus('disconnected')
      setError('Backend server is not running. Please start the backend first!')
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/posts`)
      setPosts(response.data)
      setError('')
    } catch (error) {
      setError('Failed to fetch posts. Make sure backend is running on port 5000!')
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async (e) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      setError('Please fill in title and content')
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/posts`, { 
        title: title.trim(), 
        content: content.trim(), 
        author: author.trim() || 'Anonymous' 
      })
      setTitle('')
      setContent('')
      setAuthor('')
      setError('')
      fetchPosts() // Refresh the posts list
    } catch (error) {
      setError('Failed to create post. Make sure backend is running!')
      console.error('Error creating post:', error)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '40px', padding: '20px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>
            MyBlog App
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.2rem' }}>
            Simple blogging application
          </p>
          
          {/* Backend Status */}
          <div style={{ 
            marginTop: '10px',
            padding: '10px',
            borderRadius: '5px',
            backgroundColor: backendStatus === 'connected' ? '#d1fae5' : '#fee2e2',
            color: backendStatus === 'connected' ? '#065f46' : '#991b1b',
            display: 'inline-block'
          }}>
            Backend: {backendStatus === 'connected' ? '✅ Connected' : '❌ Disconnected'}
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
            {backendStatus === 'disconnected' && (
              <div style={{ marginTop: '10px' }}>
                <strong>To fix this:</strong>
                <ol style={{ marginLeft: '20px', marginTop: '5px' }}>
                  <li>Open a new Command Prompt</li>
                  <li>Run: <code>cd backend</code></li>
                  <li>Run: <code>npm run dev</code></li>
                  <li>Wait for backend to start on port 5000</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Create Post Form */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '10px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '600', marginBottom: '20px' }}>
            Create New Post
          </h2>
          
          <form onSubmit={createPost} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                placeholder="Enter post title"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                placeholder="Your name (optional)"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  minHeight: '120px',
                  resize: 'vertical'
                }}
                placeholder="Write your post content here..."
                required
              />
            </div>

            <button
              type="submit"
              style={{ 
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              Create Post
            </button>
          </form>
        </div>

        {/* Posts List */}
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '600', marginBottom: '20px' }}>
            Blog Posts ({posts.length})
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Loading posts...</div>
            </div>
          ) : posts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '10px',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '10px' }}>📝</div>
              <p>No posts yet. Create your first post above!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {posts.map((post) => (
                <div key={post.id} style={{ 
                  backgroundColor: 'white', 
                  padding: '25px', 
                  borderRadius: '10px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '600', 
                    marginBottom: '10px',
                    color: '#1f2937'
                  }}>
                    {post.title}
                  </h3>
                  
                  <p style={{ 
                    color: '#6b7280', 
                    marginBottom: '15px',
                    fontStyle: 'italic'
                  }}>
                    By {post.author} • {new Date(post.createdAt).toLocaleString()}
                  </p>
                  
                  <p style={{ 
                    lineHeight: '1.6',
                    color: '#374151'
                  }}>
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App