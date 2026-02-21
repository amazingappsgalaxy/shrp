'use client';

import { useState } from 'react';
import { signIn, signUp, signOut, useSession } from '../../lib/auth-client';

export default function AuthTestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, isPending } = useSession();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const payload: any = {
        email,
        password,
        callbackURL: '/app/welcome'
      }
      if (name && name.trim().length > 0) {
        (payload as any).name = name
      }

      const result = await signUp.email(payload);

      if (result.error) {
        setMessage(`Sign up failed: ${result.error.message}`);
      } else {
        setMessage('Sign up successful! You are now logged in.');
        // Clear form
        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (error) {
      setMessage(`Sign up failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setMessage(`Sign in failed: ${result.error.message}`);
      } else {
        setMessage('Sign in successful!');
        // Clear form
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      setMessage(`Sign in failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      setMessage('Signed out successfully!');
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      setMessage(`Sign out failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Authentication Test</h1>
      
      {session?.user ? (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
          <h3>Welcome, {session.user.name || session.user.email}!</h3>
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>User ID:</strong> {session.user.id}</p>
          <p><strong>Session ID:</strong> {session.session.id}</p>
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              marginTop: '1rem'
            }}
          >
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      ) : (
        <form style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name (optional):</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="Enter your name"
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isLoading || !email || !password}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (isLoading || !email || !password) ? 'not-allowed' : 'pointer',
                opacity: (isLoading || !email || !password) ? 0.6 : 1
              }}
            >
              {isLoading ? 'Loading...' : 'Sign Up'}
            </button>
            
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading || !email || !password}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (isLoading || !email || !password) ? 'not-allowed' : 'pointer',
                opacity: (isLoading || !email || !password) ? 0.6 : 1
              }}
            >
              {isLoading ? 'Loading...' : 'Sign In'}
            </button>
          </div>
        </form>
      )}
      
      {message && (
        <div style={{
          padding: '1rem',
          backgroundColor: message.includes('successful') ? '#d4edda' : '#f8d7da',
          color: message.includes('successful') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('successful') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          marginTop: '1rem'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
        <h4>Test Instructions:</h4>
        <ol>
          <li>Try signing up with a new email and password</li>
          <li>Check if the user data appears in the session info</li>
          <li>Sign out and try signing in with the same credentials</li>
          <li>Verify that the session persists across page refreshes</li>
        </ol>
      </div>
    </div>
  );
}