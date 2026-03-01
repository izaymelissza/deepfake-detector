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
  model_loaded?: boolean;
  frames_analyzed?: number;
  total_frames?: number;
  gradcam?: string;
  gradcam_available?: boolean;
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
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        
        // Detect file type
        if (file.type.startsWith('image/')) {
          setFileType('image');
          setPreview(URL.createObjectURL(file));
        } else if (file.type.startsWith('video/')) {
          setFileType('video');
          setPreview(URL.createObjectURL(file));
        }
        
        setResult(null);
        setError(null);
      }
    }
  });

  const handlePredict = async () => {
    if (!selectedFile || !fileType) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Choose endpoint based on file type
    const endpoint = fileType === 'video' 
      ? `${API_URL}/predict/video`
      : `${API_URL}/predict`;

    try {
      const response = await axios.post<PredictionResult>(
        endpoint,
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
        `Failed to analyze ${fileType}. Please try again.`
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
    setFileType(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <h1 style={{ 
            color: '#1a237e', 
            fontSize: '2.5rem', 
            margin: 0,
            fontWeight: 700
          }}>
            🔍 Deepfake Detector
          </h1>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                border: '2px solid #1a237e',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#1a237e',
                fontSize: '16px'
              }}
            >
              🏠 Home
            </button>
            <button
              onClick={() => navigate('/history')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                border: '2px solid #1a237e',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#1a237e',
                fontSize: '16px'
              }}
            >
              📊 History
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                border: '2px solid #1a237e',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600,
                color: '#1a237e'
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
        <p style={{ 
          textAlign: 'center', 
          marginBottom: '40px', 
          color: '#666',
          fontSize: '1.1rem'
        }}>
          Upload an image or video to detect if it's real or manipulated
        </p>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          style={{
            border: isDragActive ? '3px dashed #1a237e' : '2px dashed #ccc',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? '#e8eaf6' : 'white',
            marginBottom: '30px',
            transition: 'all 0.3s'
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: '72px', marginBottom: '20px' }}>
            {fileType === 'video' ? '🎬' : '☁️'}
          </div>
          <h3 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '10px',
            color: '#1a237e'
          }}>
            {isDragActive 
              ? 'Drop the file here' 
              : 'Drag & drop an image or video, or click to select'}
          </h3>
          <p style={{ color: '#999', fontSize: '1rem' }}>
            Images: JPG, PNG, JPEG, WEBP | Videos: MP4, MOV, AVI, WEBM (Max 50MB)
          </p>
        </div>

        {/* Preview */}
        {preview && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: '16px', 
            marginBottom: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              {fileType === 'image' ? (
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              ) : (
                <video
                  src={preview}
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              )}
              
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={handlePredict}
                  disabled={loading}
                  style={{
                    padding: '14px 32px',
                    backgroundColor: loading ? '#ccc' : '#1a237e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading 
                    ? `⏳ Analyzing ${fileType}...` 
                    : `🔍 Detect Deepfake`}
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '14px 32px',
                    backgroundColor: 'white',
                    color: '#1a237e',
                    border: '2px solid #1a237e',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  🗑️ Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '16px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>
              {fileType === 'video' 
                ? 'Analyzing video frames with AI... This may take a minute.'
                : 'Analyzing image with AI...'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '30px',
            border: '2px solid #ef5350'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <p style={{ margin: 0, color: '#c62828', fontSize: '1.1rem' }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            style={{
              backgroundColor: result.is_fake ? '#ffebee' : '#e8f5e9',
              padding: '40px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: result.is_fake ? '3px solid #ef5350' : '3px solid #66bb6a'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>
                {result.is_fake ? '⚠️' : '✅'}
              </div>

              <h2 style={{ 
                color: result.is_fake ? '#c62828' : '#2e7d32', 
                marginBottom: '20px',
                fontSize: '2.5rem',
                fontWeight: 700
              }}>
                {result.prediction}
              </h2>

              <div
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: result.is_fake ? '#c62828' : '#2e7d32',
                  color: 'white',
                  borderRadius: '24px',
                  marginBottom: '30px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}
              >
                {(result.confidence * 100).toFixed(1)}% Confident
              </div>

              {/* Grad-CAM Heatmap - ÚJ! */}
              {result.gradcam_available && result.gradcam && fileType === 'image' && (
                <div style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  marginBottom: '30px',
                  border: '2px solid #1a237e'
                }}>
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    marginBottom: '16px',
                    color: '#1a237e'
                  }}>
                    🔍 AI Focus Areas (Grad-CAM)
                  </h3>
                  <p style={{ 
                    color: '#666', 
                    marginBottom: '16px',
                    fontSize: '0.95rem'
                  }}>
                    Red/yellow areas show where the AI focused to make its decision
                  </p>
                  <img
                    src={result.gradcam}
                    alt="Grad-CAM Heatmap"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '500px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
              )}

              {/* Video frames info */}
              {fileType === 'video' && result.frames_analyzed && (
                <div style={{
                  backgroundColor: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <p style={{ margin: 0, color: '#666' }}>
                    📊 Analyzed {result.frames_analyzed} frames out of {result.total_frames} total
                  </p>
                </div>
              )}

              {result.model_loaded === false && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '2px solid #ffc107'
                }}>
                  <p style={{ margin: 0, color: '#856404' }}>
                    ℹ️ Using demo mode (model not loaded)
                  </p>
                </div>
              )}

              <div style={{ 
                textAlign: 'left', 
                marginTop: '30px',
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px'
              }}>
                <h4 style={{ 
                  marginBottom: '20px',
                  fontSize: '1.3rem',
                  color: '#1a237e'
                }}>
                  📊 Analysis Details:
                </h4>
                
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '10px',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                      Fake Score:
                    </span>
                    <strong style={{ fontSize: '1.2rem', color: '#c62828' }}>
                      {(result.details.fake_score * 100).toFixed(1)}%
                    </strong>
                  </div>
                  <div style={{ 
                    backgroundColor: '#e0e0e0', 
                    height: '12px', 
                    borderRadius: '6px', 
                    overflow: 'hidden' 
                  }}>
                    <div
                      style={{
                        width: `${result.details.fake_score * 100}%`,
                        height: '100%',
                        backgroundColor: '#c62828',
                        transition: 'width 0.5s'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '10px',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                      Real Score:
                    </span>
                    <strong style={{ fontSize: '1.2rem', color: '#2e7d32' }}>
                      {(result.details.real_score * 100).toFixed(1)}%
                    </strong>
                  </div>
                  <div style={{ 
                    backgroundColor: '#e0e0e0', 
                    height: '12px', 
                    borderRadius: '6px', 
                    overflow: 'hidden' 
                  }}>
                    <div
                      style={{
                        width: `${result.details.real_score * 100}%`,
                        height: '100%',
                        backgroundColor: '#2e7d32',
                        transition: 'width 0.5s'
                      }}
                    />
                  </div>
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