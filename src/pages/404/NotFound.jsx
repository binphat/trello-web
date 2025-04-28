import React from 'react'
import { Link } from 'react-router-dom'
import { ReactComponent as PlanetSvg } from '~/assets/404/planet.svg'
import { ReactComponent as AstronautSvg } from '~/assets/404/astronaut.svg'

export default function NotFound() {
  return (
    <div style={{
      backgroundColor: '#202942',
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '\'Poppins\', sans-serif',
      textAlign: 'center',
      color: '#fff',
      padding: '0 20px',
      overflow: 'hidden'
    }}>
      <h1 style={{ fontSize: '8rem', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
        LOST IN <span style={{ textDecoration: 'line-through' }}>SPACE</span> <span style={{ color: '#e67e22', fontWeight:'700' }}>Team-Up</span>? Hmm, looks like that page no exist.
      </p>
      <div style={{ position: 'relative', width: '500px', height: '400px' }}>
        {/* Planet đứng im, to hơn */}
        <PlanetSvg style={{
          width: '300px',
          height: '300px',
          margin: '0 auto'
        }} />
        {/* Astronaut nhỏ và xa hơn */}
        <AstronautSvg style={{
          width: '40px',
          position: 'absolute',
          top: '10%',
          left: '90%',
          transform: 'translate(-50%, -50%)',
          animation: 'astronaut-float 12s linear infinite'
        }} />
      </div>

      {/* Go Home dùng Link */}
      <Link
        to="/"
        style={{
          marginTop: '8px',
          padding: '12px 24px',
          backgroundColor: 'transparent',
          border: '1px solid #fff',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '600',
          textDecoration: 'none',
          transition: 'background-color 0.3s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#cf711f'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        Go Home
      </Link>

      <style>{`
        @keyframes astronaut-float {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateY(0); }
          50% { transform: translate(-50%, -50%) rotate(180deg) translateY(-30px); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateY(0); }
        }
      `}</style>
    </div>
  )
}
