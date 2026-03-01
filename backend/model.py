import torch
import torch.nn as nn
from torchvision import models

class DeepfakeDetector(nn.Module):
    """EfficientNet-B4 based deepfake detector"""
    
    def __init__(self):
        super(DeepfakeDetector, self).__init__()
        
        # Load EfficientNet-B4 backbone
        self.backbone = models.efficientnet_b4(weights=None)
        
        # Get number of features
        num_features = self.backbone.classifier[1].in_features
        
        # Replace classifier
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.BatchNorm1d(512),
            nn.Dropout(p=0.3),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.BatchNorm1d(256),
            nn.Dropout(p=0.2),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
    
    def forward(self, x):
        return self.backbone(x)