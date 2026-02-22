// src/pages/HistoryPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Detection {
  id: number;
  filename: string;
  prediction: string;
  confidence: number;
  created_at: string;
}

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:8000/history');
        setHistory(response.data);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '40px'
        }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', color: '#1a237e', margin: '0 0 10px 0' }}>
              Detection History
            </h1>
            <p style={{ color: '#666', margin: 0 }}>
              Your past deepfake detection results
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1a237e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              New Detection
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                border: '2px solid #1a237e',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#1a237e'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>No detections yet</h3>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              Upload your first image to start detecting deepfakes!
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '14px 32px',
                backgroundColor: '#1a237e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              Upload Image
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {history.map((detection) => (
              <div
                key={detection.id}
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: detection.prediction === 'FAKE' ? '2px solid #ef5350' : '2px solid #66bb6a'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '32px' }}>
                    {detection.prediction === 'FAKE' ? '⚠️' : '✅'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: detection.prediction === 'FAKE' ? '#c62828' : '#2e7d32'
                    }}>
                      {detection.prediction}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#999' }}>
                      {(detection.confidence * 100).toFixed(1)}% confident
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: '#666',
                    wordBreak: 'break-all'
                  }}>
                    📄 {detection.filename}
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#999' }}>
                  🕐 {new Date(detection.created_at).toLocaleString('hu-HU')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;