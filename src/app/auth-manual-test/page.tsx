'use client';

import { useState } from 'react';

export default function AuthManualTestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const parseResponseSafely = async (response: Response) => {
    const contentType = response.headers.get('content-type') || ''
    try {
      if (contentType.includes('application/json')) {
        return await response.json()
      }
      // Fallback when not JSON
      const text = await response.text()
      return text ? { error: text } : null
    } catch (e) {
      // As a last resort, attempt text to avoid throwing in UI
      const text = await response.text().catch(() => '')
      return text ? { error: text } : null
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      const result = await parseResponseSafely(response);
      
      if (response.ok) {
        setMessage(`✅ Sign up successful! User ID: ${result?.user?.id ?? 'unknown'}`);
        setEmail('');
        setPassword('');
        setName('');
      } else {
        const errMsg = (result && (result.error || result.message)) || `HTTP ${response.status} ${response.statusText}`
        setMessage(`❌ Sign up failed: ${errMsg}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await parseResponseSafely(response);
      
      if (response.ok) {
        setMessage(`✅ Sign in successful! Session: ${result?.session?.id ?? 'created'}`);
      } else {
        const errMsg = (result && (result.error || result.message)) || `HTTP ${response.status} ${response.statusText}`
        setMessage(`❌ Sign in failed: ${errMsg}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Manual Authentication Test</h1>
      
      {message && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '1rem', 
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: message.includes('✅') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSignUp} style={{ marginBottom: '2rem' }}>
        <h3>Sign Up</h3>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>

      <form onSubmit={handleSignIn}>
        <h3>Sign In</h3>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h4>Test Instructions:</h4>
        <ol>
          <li>Fill in the sign-up form with a test email and password</li>
          <li>Click "Sign Up" to create a new account</li>
          <li>Check the message for success/error feedback</li>
          <li>Use the same credentials to test sign-in</li>
          <li>Verify the authentication flow works end-to-end</li>
        </ol>
      </div>
    </div>
  );
}