import torch
import torch.nn.functional as F
import numpy as np
import cv2 # type: ignore
from PIL import Image

class GradCAM:
    """Generate Grad-CAM heatmap for CNN models"""
    
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register hooks
        self.target_layer.register_forward_hook(self.save_activation)
        self.target_layer.register_full_backward_hook(self.save_gradient)  # ← JAVÍTVA!
    
    def save_activation(self, module, input, output):
        """Hook to save forward pass activations"""
        self.activations = output.detach()
    
    def save_gradient(self, module, grad_input, grad_output):
        """Hook to save backward pass gradients"""
        self.gradients = grad_output[0].detach()
    
    def generate_heatmap(self, input_tensor):
        """Generate Grad-CAM heatmap for FAKE detection"""
        
        # Forward pass
        self.model.eval()
        output = self.model(input_tensor)
        
        # Binary classification: output = REAL probability
        real_prob = output[0, 0]
        
        # FAKE SCORE = 1 - REAL
        # Maximize fake score = minimize real score
        score = -real_prob  # ← NEGATÍV = gradient will point to FAKE areas!
        
        # Backward pass
        self.model.zero_grad()
        score.backward(retain_graph=True)
        
        # Get gradients and activations
        gradients = self.gradients  # (1, C, H, W)
        activations = self.activations  # (1, C, H, W)
        
        # Global average pooling of gradients
        weights = gradients.mean(dim=(2, 3), keepdim=True)  # (1, C, 1, 1)
        
        # Weighted combination
        cam = (weights * activations).sum(dim=1, keepdim=True)  # (1, 1, H, W)
        
        # ReLU (keep only positive contributions)
        cam = F.relu(cam)
        
        # Normalize to 0-1
        cam = cam.squeeze().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        
        return cam
    
    def overlay_heatmap(self, heatmap, original_image, alpha=0.4, colormap=cv2.COLORMAP_JET):
        """Overlay heatmap on original image"""
        
        # Convert PIL to numpy if needed
        if isinstance(original_image, Image.Image):
            original_image = np.array(original_image)
        
        # Resize heatmap to match original
        h, w = original_image.shape[:2]
        heatmap_resized = cv2.resize(heatmap, (w, h))
        
        # Convert to RGB colormap
        heatmap_colored = cv2.applyColorMap(
            (heatmap_resized * 255).astype(np.uint8), 
            colormap
        )
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
        
        # Overlay
        overlayed = (heatmap_colored * alpha + original_image * (1 - alpha)).astype(np.uint8)
        
        return Image.fromarray(overlayed)


def get_gradcam_for_image(model, image_tensor, original_image, device='cpu'):
    """Generate Grad-CAM visualization for deepfake detection"""
    
    # Get the last convolutional layer
    target_layer = model.backbone.features[-1]
    
    # Create Grad-CAM
    gradcam = GradCAM(model, target_layer)
    
    # Generate heatmap
    model.to(device)
    image_tensor = image_tensor.to(device)
    
    heatmap = gradcam.generate_heatmap(image_tensor)
    
    # Overlay on original image
    overlayed_image = gradcam.overlay_heatmap(heatmap, original_image)
    
    return {
        'heatmap': heatmap,
        'overlayed_image': overlayed_image
    }