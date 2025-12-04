import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface PredictionResult {
  prediction: 'REAL' | 'FAKE';
  is_fake: boolean;
  confidence: number;
  probability: number;
  details: {
    fake_score: number;
    real_score: number;
  };
}

const API_URL = 'http://localhost:8000';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        setResult(null);
        setError(null);
      }
    }
  });

  const handlePredict = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post<PredictionResult>(
        `${API_URL}/predict`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setResult(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Failed to analyze image. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#1a237e', fontSize: '2.5rem' }}>🔍 Deepfake Detector</h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              border: '2px solid #1a237e',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🚪 Logout
          </button>
        </div>

        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
          Upload an image to detect if it's real or manipulated
        </p>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          style={{
            border: isDragActive ? '3px dashed #1a237e' : '2px dashed #ccc',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? '#e8eaf6' : 'white',
            marginBottom: '20px'
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>☁️</div>
          <h3>{isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}</h3>
          <p style={{ color: '#999' }}>Supported: JPG, PNG, JPEG, WEBP</p>
        </div>

        {/* Preview */}
        {preview && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handlePredict}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading ? '#ccc' : '#1a237e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {loading ? '⏳ Analyzing...' : '🔍 Detect Deepfake'}
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#1a237e',
                  border: '2px solid #1a237e',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px' }}>⏳</div>
            <p>Analyzing image...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ backgroundColor: '#ffebee', padding: '16px', borderRadius: '8px', marginBottom: '20px', color: '#c62828' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            style={{
              backgroundColor: result.is_fake ? '#ffebee' : '#e8f5e9',
              padding: '30px',
              borderRadius: '12px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>
              {result.is_fake ? '⚠️' : '✅'}
            </div>

            <h2 style={{ color: result.is_fake ? '#c62828' : '#2e7d32', marginBottom: '16px' }}>
              {result.prediction}
            </h2>

            <div
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: result.is_fake ? '#c62828' : '#2e7d32',
                color: 'white',
                borderRadius: '20px',
                marginBottom: '24px'
              }}
            >
              {(result.confidence * 100).toFixed(1)}% Confident
            </div>

            <div style={{ textAlign: 'left', marginTop: '24px' }}>
              <h4 style={{ marginBottom: '16px' }}>Details:</h4>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Fake Score:</span>
                  <strong>{(result.details.fake_score * 100).toFixed(1)}%</strong>
                </div>
                <div style={{ backgroundColor: '#e0e0e0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${result.details.fake_score * 100}%`,
                      height: '100%',
                      backgroundColor: '#c62828'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Real Score:</span>
                  <strong>{(result.details.real_score * 100).toFixed(1)}%</strong>
                </div>
                <div style={{ backgroundColor: '#e0e0e0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${result.details.real_score * 100}%`,
                      height: '100%',
                      backgroundColor: '#2e7d32'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;