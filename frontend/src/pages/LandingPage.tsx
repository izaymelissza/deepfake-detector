import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      {/* Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
          padding: '80px 20px',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '20px', lineHeight: 1.2 }}>
            Detect Deepfakes
            <br />
            with AI 
          </h1>
          <p style={{ fontSize: '1.5rem', opacity: 0.9, marginBottom: '40px' }}>
            Protect yourself from manipulated media using advanced
            machine learning technology
          </p>

          {/* JAVÍTOTT GOMBOK - User alapján változnak */}
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              // HA BE VAN JELENTKEZVE
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    padding: '16px 40px',
                    backgroundColor: 'white',
                    color: '#1a237e',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  Go to Dashboard 🚀
                </button>
                <button
                  onClick={() => navigate('/history')}
                  style={{
                    padding: '16px 40px',
                    backgroundColor: 'transparent',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  View History 📊
                  </button>
                <button
                  onClick={logout}
                  style={{
                    padding: '16px 40px',
                    backgroundColor: 'transparent',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Logout 🚪
                </button>
              </>
            ) : (
              // HA NINCS BEJELENTKEZVE
              <>
                <button
                  onClick={() => navigate('/register')}
                  style={{
                    padding: '16px 40px',
                    backgroundColor: 'white',
                    color: '#1a237e',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  Get Started Free 🚀
                </button>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '16px 40px',
                    backgroundColor: 'transparent',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* What is Deepfake */}
      <div style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', color: '#1a237e', marginBottom: '20px' }}>
          What are Deepfakes?
        </h2>
        <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666', maxWidth: '800px', margin: '0 auto 60px' }}>
          Deepfakes are synthetic media where AI is used to replace or
          manipulate a person's likeness, creating realistic but fake images or videos.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          {/* Card 1 */}
          <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}></div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#1a237e' }}>The Threat</h3>
            <p style={{ color: '#666', lineHeight: 1.6 }}>
              Deepfakes can spread misinformation, damage reputations,
              and enable fraud. They're becoming increasingly realistic
              and harder to detect with the naked eye.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}></div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#1a237e' }}>Growing Problem</h3>
            <p style={{ color: '#666', lineHeight: 1.6 }}>
              Deepfake incidents have increased by x% in the last year.
              The technology is becoming more accessible and sophisticated,
              making detection crucial.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}></div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#1a237e' }}>Our Solution</h3>
            <p style={{ color: '#666', lineHeight: 1.6 }}>
              Using models to detect deepfakes, we help users verify media authenticity
              quickly and accurately, protecting them from potential harm.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', color: '#1a237e', marginBottom: '20px' }}>
            Why Choose DeepGuard?
          </h2>
          <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666', marginBottom: '60px' }}>
            Industry-leading deepfake detection technology
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}></div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#1a237e' }}>95%+ Accuracy</h3>
              <p style={{ color: '#666' }}>
                majd annyi lesz (vagy hasonlo)
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}></div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#1a237e' }}>Instant Results</h3>
              <p style={{ color: '#666' }}>
                fast results
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}></div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#1a237e' }}>Easy to Use</h3>
              <p style={{ color: '#666' }}>
                Simply upload an image and get instant analysis. No
                technical knowledge required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
          padding: '80px 20px',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: 700 }}>
            {user ? 'Ready to Detect?' : 'Ready to Start Detecting?'}
          </h2>
          <p style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '40px' }}>
            {user 
              ? 'Upload an image and let AI analyze it for you'
              : 'Join thousands of users protecting themselves from deepfakes'
            }
          </p>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/register')}
            style={{
              padding: '18px 50px',
              backgroundColor: 'white',
              color: '#1a237e',
              border: 'none',
              borderRadius: '8px',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {user ? 'Start Detecting 🔍' : 'Get Started for Free 🚀'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#1a237e', color: 'white', padding: '30px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, opacity: 0.7 }}>
          © 2024 DeepGuard. Built with ❤️ for safer internet.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;