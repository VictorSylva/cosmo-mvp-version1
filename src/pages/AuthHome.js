import React from "react";
import { useNavigate } from "react-router-dom";

const AuthHome = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '20px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px',
        maxWidth: '700px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Login Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '36px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/login')}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '16px' }}>Login</h2>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
            Access your account - works for all users, partners, and admins.
          </p>
          <button style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '12px 28px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onClick={e => { e.stopPropagation(); navigate('/login'); }}
          onMouseOver={e => e.target.style.backgroundColor = '#4338ca'}
          onMouseOut={e => e.target.style.backgroundColor = '#4f46e5'}
          >
            Login
          </button>
        </div>

        {/* Signup Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '36px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/signup')}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '16px' }}>Sign Up</h2>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
            Create a new account to start shopping or register your store.
          </p>
          <button style={{
            backgroundColor: '#f59e42',
            color: 'white',
            padding: '12px 28px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onClick={e => { e.stopPropagation(); navigate('/signup'); }}
          onMouseOver={e => e.target.style.backgroundColor = '#d97706'}
          onMouseOut={e => e.target.style.backgroundColor = '#f59e42'}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthHome;