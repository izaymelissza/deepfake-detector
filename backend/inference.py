import torch
from torchvision import transforms
from PIL import Image
import os
import random

# Ha van model.py, importáld:
try:
    from model import DeepfakeDetector
    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False
    print("⚠️  Model.py not found, using dummy predictions")

class InferenceService:
    """Handles model loading and inference"""
    
    def __init__(self):
        self.model = None
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    def load_model(self, model_path: str):
        """Load trained model"""
        if not os.path.exists(model_path):
            print(f"⚠️  Model not found at {model_path}")
            print(f"⚠️  Using dummy predictions!")
            return False
        
        if not MODEL_AVAILABLE:
            print(f"⚠️  Model class not available")
            print(f"⚠️  Using dummy predictions!")
            return False
        
        try:
            self.model = DeepfakeDetector()
            
            # Load weights
            state_dict = torch.load(
                model_path,
                map_location=self.device,
                weights_only=False
            )
            
            self.model.load_state_dict(state_dict)
            self.model.to(self.device)
            self.model.eval()
            
            print(f"✓ Model loaded successfully on {self.device}")
            return True
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            print(f"⚠️  Using dummy predictions!")
            return False
    
    def predict(self, image: Image.Image) -> dict:
        """Run inference on image"""
        
        # DUMMY PREDICTION (ha nincs model)
        if self.model is None:
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
                },
                'model_loaded': False
            }
        
        # REAL MODEL PREDICTION
        try:
            # Preprocess image
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Inference
            with torch.no_grad():
                output = self.model(image_tensor)
                probability = output.item()
            
            # Interpret result
            is_fake = probability > 0.5
            confidence = probability if is_fake else 1 - probability
            
            return {
                'prediction': 'FAKE' if is_fake else 'REAL',
                'is_fake': is_fake,
                'confidence': round(confidence, 2),
                'probability': round(probability, 2),
                'details': {
                    'fake_score': round(probability, 2),
                    'real_score': round(1 - probability, 2)
                },
                'model_loaded': True
            }
        
        except Exception as e:
            print(f"❌ Model inference failed: {e}")
            # Fallback to dummy
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
                },
                'model_loaded': False
            }

# Global instance
inference_service = InferenceService()