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
        self.target_layer.register_full_backward_hook(self.save_gradient)  
    
    def save_activation(self, module, input, output):
        """Hook to save forward pass activations"""
        self.activations = output.detach()
    
    def save_gradient(self, module, grad_input, grad_output):
        """Hook to save backward pass gradients"""
        self.gradients = grad_output[0].detach()
    
    def generate_heatmap(self, input_tensor):
        self.model.eval()
        output = self.model(input_tensor)
        
        real_prob = output[0, 0]
        
        score = -real_prob  # NEGATIVE 
        
        self.model.zero_grad()
        score.backward(retain_graph=True)
        
        gradients = self.gradients 
        activations = self.activations 
        
        weights = gradients.mean(dim=(2, 3), keepdim=True)  
        
        cam = (weights * activations).sum(dim=1, keepdim=True)
        
        cam = F.relu(cam)
        cam = cam.squeeze().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        
        return cam
    
    def overlay_heatmap(self, heatmap, original_image, alpha=0.4, colormap=cv2.COLORMAP_JET):
        """Overlay heatmap on original image"""
        
        if isinstance(original_image, Image.Image):
            original_image = np.array(original_image)
        
        h, w = original_image.shape[:2]
        heatmap_resized = cv2.resize(heatmap, (w, h))
        
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
    
    target_layer = model.backbone.features[-1]
    
    gradcam = GradCAM(model, target_layer)
    
    model.to(device)
    image_tensor = image_tensor.to(device)
    
    heatmap = gradcam.generate_heatmap(image_tensor)
    
    overlayed_image = gradcam.overlay_heatmap(heatmap, original_image)
    
    return {
        'heatmap': heatmap,
        'overlayed_image': overlayed_image
    }