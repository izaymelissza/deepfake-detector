from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from PIL import Image
import io
from typing import List
from datetime import datetime
from database import get_db, User, Detection
from auth import get_password_hash, verify_password, create_token, get_current_user
from inference import inference_service
import cv2 # type: ignore
import tempfile
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    import os
    
    model_path = "models/best_efficientnet_b4.pth"
    
    print("=" * 60)
    print("🚀 STARTING MODEL LOAD...")
    print("=" * 60)
    print(f"🔍 Current directory: {os.getcwd()}")
    print(f"🔍 Model path: {model_path}")
    print(f"🔍 Absolute path: {os.path.abspath(model_path)}")
    print(f"🔍 File exists: {os.path.exists(model_path)}")
    
    if os.path.exists(model_path):
        file_size = os.path.getsize(model_path) / (1024 * 1024)  # MB
        print(f"🔍 File size: {file_size:.2f} MB")
    
    print("-" * 60)
    
    success = inference_service.load_model(model_path)
    
    print("-" * 60)
    if success:
        print("✅ MODEL LOADED SUCCESSFULLY!")
    else:
        print("⚠️  MODEL NOT LOADED - USING DUMMY PREDICTIONS")
    print("=" * 60)

# Schemas
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Routes
@app.get("/")
def read_root():
    return {"message": "Backend működik!"}

@app.get("/health")
def health():
    return {"status": "OK"}

@app.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Check if exists
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create token
    token = create_token(user.id)
    return TokenResponse(access_token=token)

from fastapi.security import OAuth2PasswordRequestForm
from database import Base, engine

@app.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),  # ← ÚJ! Form helyett JSON
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_token(user.id)
    return TokenResponse(access_token=token)

@app.post("/predict")
async def predict_deepfake(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Predict if image is deepfake using trained model
    """
    
    # Validate file
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        result = inference_service.predict(image, return_gradcam=True)

        print(f"✓ Prediction: {result['prediction']}, Confidence: {result['confidence']}")
        
        # Save to database
        try:
            detection = Detection(
                user_id=current_user.id,
                filename=file.filename,
                prediction=result['prediction'],
                confidence=result['confidence']
            )
            db.add(detection)
            db.commit()
            db.refresh(detection)
            
            print(f"✓ Detection saved! ID: {detection.id}")
            
        except Exception as db_error:
            print(f"⚠️  Database save failed: {db_error}")
            db.rollback()
        
        return result
        
    except Exception as e:
        print(f"❌ Prediction failed!")
        print(f"❌ Error type: {type(e).__name__}")
        print(f"❌ Error message: {str(e)}")
        
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500, 
            detail=f"Prediction failed: {str(e)}"
        )

@app.post("/predict/video")
async def predict_video(   
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Predict if video is deepfake using frame-by-frame analysis
    """
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
            contents = await file.read()
            tmp_file.write(contents)
            video_path = tmp_file.name
        
        print(f"✓ Video saved: {file.filename} ({len(contents)} bytes)")
        
        # Process video frame-by-frame
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open video file")
        
        frame_predictions = []
        frame_count = 0
        sample_rate = 10  # Analyze every 10th frame
        
        print(f"🎬 Processing video...")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % sample_rate == 0:
                try:
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_image = Image.fromarray(frame_rgb)

                    frame_result = inference_service.predict(pil_image)
                    fake_prob = frame_result['probability']
                    frame_predictions.append(fake_prob)
                    
                except Exception as frame_error:
                    print(f"Frame {frame_count} failed: {frame_error}")
            
            frame_count += 1
        
        cap.release()

        # Clean up temp file
        try:
            os.unlink(video_path)
        except:
            pass
        
        # Aggregate results
        if not frame_predictions:
            raise HTTPException(status_code=500, detail="No frames could be analyzed")
        
        import numpy as np

        avg_fake_prob = float(np.mean(frame_predictions))
        is_fake = avg_fake_prob > 0.5
        confidence = max(avg_fake_prob, 1 - avg_fake_prob)
        
        result = {
            'prediction': 'FAKE' if is_fake else 'REAL',
            'is_fake': is_fake,
            'confidence': round(confidence, 2),
            'probability': round(avg_fake_prob, 2),
            'details': {
                'fake_score': round(avg_fake_prob, 2),
                'real_score': round(1 - avg_fake_prob, 2)
            },
            'frames_analyzed': len(frame_predictions),
            'total_frames': frame_count,
            'model_loaded': inference_service.model is not None
        }
        
        print(f"✓ Video analysis complete: {result['prediction']} ({result['confidence']:.2%})")
        print(f"  Frames analyzed: {len(frame_predictions)}/{frame_count}")
        
        # Save to database
        try:
            detection = Detection(
                user_id=current_user.id,
                filename=file.filename,
                prediction=result['prediction'],
                confidence=result['confidence']
            )
            db.add(detection)
            db.commit()
            db.refresh(detection)
            
            print(f"✓ Detection saved! ID: {detection.id}")
        
        except Exception as db_error:
            print(f"⚠️  Database save failed: {db_error}")
            db.rollback()
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Video prediction failed!")
        print(f"❌ Error: {str(e)}")
        
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500, 
            detail=f"Video prediction failed: {str(e)}"
        )


@app.get("/history")
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    detections = db.query(Detection)\
        .filter(Detection.user_id == current_user.id)\
        .order_by(Detection.created_at.desc())\
        .limit(20)\
        .all()
    
    return [{
        'id': d.id,
        'filename': d.filename,
        'prediction': d.prediction,
        'confidence': d.confidence,
        'created_at': d.created_at.isoformat()
    } for d in detections]