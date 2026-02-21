'use client'

export default function TestStyles() {
  return (
    <div 
      className="min-h-screen bg-black text-white p-8"
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        color: '#ffffff',
        padding: '2rem'
      }}
    >
      <h1 
        className="text-4xl font-bold text-blue-500 mb-4"
        style={{
          fontSize: '2.25rem',
          fontWeight: 'bold',
          color: '#3b82f6',
          marginBottom: '1rem'
        }}
      >
        CSS Test Page
      </h1>
      <div 
        className="bg-gray-800 p-6 rounded-lg border border-gray-600"
        style={{
          backgroundColor: '#1f2937',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #4b5563'
        }}
      >
        <p 
          className="text-lg text-gray-300 mb-4"
          style={{
            fontSize: '1.125rem',
            color: '#d1d5db',
            marginBottom: '1rem'
          }}
        >
          If you can see this styled properly, CSS is working. Both Tailwind classes and inline styles should be visible.
        </p>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          Test Button
        </button>
      </div>
      <div 
        className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        <div 
          className="bg-red-500 p-4 rounded"
          style={{
            backgroundColor: '#ef4444',
            padding: '1rem',
            borderRadius: '0.25rem'
          }}
        >
          Red Card
        </div>
        <div 
          className="bg-green-500 p-4 rounded"
          style={{
            backgroundColor: '#10b981',
            padding: '1rem',
            borderRadius: '0.25rem'
          }}
        >
          Green Card
        </div>
        <div 
          className="bg-purple-500 p-4 rounded"
          style={{
            backgroundColor: '#8b5cf6',
            padding: '1rem',
            borderRadius: '0.25rem'
          }}
        >
          Purple Card
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#374151', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Debug Information</h2>
        <p style={{ marginBottom: '0.5rem' }}>✅ Inline styles are working</p>
        <p style={{ marginBottom: '0.5rem' }}>🎨 Tailwind classes: <span className="text-blue-400">Should be blue if Tailwind works</span></p>
        <p style={{ marginBottom: '0.5rem' }}>📱 Responsive: This should stack on mobile</p>
      </div>
    </div>
  )
}