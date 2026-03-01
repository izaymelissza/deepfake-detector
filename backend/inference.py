import torch
from torchvision import transforms
from PIL import Image
import os
import random

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
        
        # DUMMY PREDICTION IF MODEL NOT LOADED
        if self.model is None:
            is_fake = random.choice([True, False])
            confidence = random.uniform(0.75, 0.99)
            fake_prob = confidence if is_fake else 1 - confidence
            
            return {
                'prediction': 'FAKE' if is_fake else 'REAL',
                'is_fake': is_fake,
                'confidence': round(confidence, 2),
                'probability': round(fake_prob, 2),
                'details': {
                    'fake_score': round(fake_prob, 2),
                    'real_score': round(1 - fake_prob, 2)
                },
                'model_loaded': False
            }
        
        try:
            # Preprocess image
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Inference
            with torch.no_grad():
                output = self.model(image_tensor)
                real_prob = output.item()  # ← JAVÍTVA: Model outputs REAL probability!
            
            # Interpret result 
            fake_prob = 1 - real_prob     # ← Fake probability
            is_fake = fake_prob > 0.5      # ← Is fake if fake_prob > 0.5
            confidence = max(real_prob, fake_prob)  # ← Confidence = higher of the two
            
            return {
                'prediction': 'FAKE' if is_fake else 'REAL',
                'is_fake': is_fake,
                'confidence': round(confidence, 2),
                'probability': round(fake_prob, 2),  # Frontend expects fake probability
                'details': {
                    'fake_score': round(fake_prob, 2),
                    'real_score': round(real_prob, 2)
                },
                'model_loaded': True
            }
        
        except Exception as e:
            print(f"❌ Model inference failed: {e}")
            import traceback
            traceback.print_exc()
            
            # Fallback to dummy
            is_fake = random.choice([True, False])
            confidence = random.uniform(0.75, 0.99)
            fake_prob = confidence if is_fake else 1 - confidence
            
            return {
                'prediction': 'FAKE' if is_fake else 'REAL',
                'is_fake': is_fake,
                'confidence': round(confidence, 2),
                'probability': round(fake_prob, 2),
                'details': {
                    'fake_score': round(fake_prob, 2),
                    'real_score': round(1 - fake_prob, 2)
                },
                'model_loaded': False,
                'error': str(e)
            }
# Global instance
inference_service = InferenceService()