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
from inference import inference_service  # ← EZ KELL!

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
    # form_data.username = email
    # form_data.password = password
    
    # Find user
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
        
        print(f"✓ Image loaded: {file.filename}")
        
        # Predict using model
        result = inference_service.predict(image)
        
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
            # Continue anyway - prediction still works!
        
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