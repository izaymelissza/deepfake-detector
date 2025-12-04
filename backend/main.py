from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from PIL import Image
import io
import random

from database import get_db, User
from auth import hash_password, verify_password, create_token

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        hashed_password=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create token
    token = create_token(user.id)
    return TokenResponse(access_token=token)

@app.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_token(user.id)
    return TokenResponse(access_token=token)

@app.post("/predict")
async def predict_deepfake(file: UploadFile = File(...)):
    """
    Predict if image is deepfake (DUMMY VERSION - no model yet!)
    """
    
    # Validate file
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # DUMMY PREDICTION (később lesz model!)
        is_fake = random.choice([True, False])
        confidence = random.uniform(0.75, 0.99)
        
        return {
            'prediction': 'FAKE' if is_fake else 'REAL',
            'is_fake': is_fake,
            'confidence': round(confidence, 2),
            'probability': round(confidence if is_fake else 1 - confidence, 2),
            'details': {
                'fake_score': round(confidence if is_fake else 1 - confidence, 2),
                'real_score': round(1 - confidence if is_fake else confidence, 2)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")