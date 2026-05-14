"""
Explainable AI (XAI) utilities for AAROH using Grad-CAM.

This module provides a simple Grad-CAM implementation for PyTorch models,
specifically tested with MobileNetV2 used for pest detection.

Grad-CAM (Gradient-weighted Class Activation Mapping) highlights *where*
the model is looking in the image when making a prediction:

1. Run a forward pass and capture the feature maps from a convolution layer.
2. Run a backward pass from the target class score and capture gradients
   with respect to those feature maps.
3. Average the gradients over spatial dimensions to obtain one weight
   per channel (importance of each feature map).
4. Compute a weighted sum of the feature maps, apply ReLU, and normalize.
   The result is a coarse heatmap of important regions for that prediction.
"""

from __future__ import annotations

import base64
from typing import Tuple

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from torch import nn

def _get_last_conv_layer(model: nn.Module) -> nn.Module:
    """
    Find the *last* convolutional layer in the model.

    For MobileNetV2 from torchvision this will typically be the last Conv2d
    in `model.features`, but this helper makes it robust to small changes
    by scanning the module tree.
    """
    last_conv = None
    for module in model.modules():
        if isinstance(module, nn.Conv2d):
            last_conv = module

    if last_conv is None:
        raise RuntimeError("No Conv2d layer found in the model for Grad-CAM.")

    return last_conv

def _tensor_to_image_np(image_tensor: torch.Tensor) -> np.ndarray:
    """
    Convert a 3xHxW or 1x3xHxW tensor (0–1 or normalized) to a HxWx3 uint8 image.

    This assumes the tensor is already in RGB order. If the tensor was
    normalized (e.g. ImageNet mean/std) you may want to de-normalize before
    calling this function. Here we keep it simple and just rescale to [0, 255].
    """
    if image_tensor.dim() == 4:
        image_tensor = image_tensor[0]

    # Move to CPU, detach gradients, and convert to numpy (C, H, W).
    img = image_tensor.detach().cpu().float().numpy()

    # Rescale to [0, 1] based on current min/max to avoid washed-out images.
    img_min, img_max = img.min(), img.max()
    if img_max > img_min:
        img = (img - img_min) / (img_max - img_min)
    else:
        img = np.zeros_like(img)

    img = np.transpose(img, (1, 2, 0))  # C,H,W -> H,W,C
    img = (img * 255.0).clip(0, 255).astype(np.uint8)
    return img

def _overlay_heatmap_on_image(
    base_image_bgr: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = 0.4,
) -> np.ndarray:
    """
    Overlay a heatmap (HxW float in [0,1]) on top of a base BGR image.

    - `alpha` controls transparency of the colored heatmap.
    - Returns a BGR uint8 image.
    """
    h, w = base_image_bgr.shape[:2]

    # Resize heatmap to match the base image spatial size.
    heatmap_resized = cv2.resize(heatmap, (w, h))

    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

    # Blend: alpha * heatmap + (1 - alpha) * original.
    overlay = cv2.addWeighted(heatmap_color, alpha, base_image_bgr, 1 - alpha, 0)
    return overlay

def generate_heatmap(model: nn.Module, image_tensor: torch.Tensor) -> str:
    """
    Generate a Grad-CAM heatmap for the given model and input image.

    Parameters
    ----------
    model:
        Trained PyTorch classification model (e.g. MobileNetV2).
        The model should output class scores (logits) of shape [B, num_classes].
    image_tensor:
        Input image tensor of shape [1, 3, H, W] or [3, H, W].
        It should already be preprocessed as expected by `model`.

    Returns
    -------
    str
        Base64-encoded PNG of the original image with the Grad-CAM heatmap
        overlaid, ready to send in an API response.
    """
    model.eval()

    # Ensure batch dimension.
    if image_tensor.dim() == 3:
        image_tensor = image_tensor.unsqueeze(0)

    image_tensor = image_tensor.to(next(model.parameters()).device)

    target_layer = _get_last_conv_layer(model)

    activations: torch.Tensor | None = None
    gradients: torch.Tensor | None = None

    def forward_hook(_module, _input, output):
        nonlocal activations
        activations = output

    def backward_hook(_module, grad_input, grad_output):
        nonlocal gradients
        # grad_output is a tuple; we take the gradient wrt the layer's output.
        gradients = grad_output[0]

    # Register hooks.
    fwd_handle = target_layer.register_forward_hook(forward_hook)
    bwd_handle = target_layer.register_backward_hook(backward_hook)  # type: ignore[arg-type]

    try:
        model.zero_grad(set_to_none=True)
        logits: torch.Tensor = model(image_tensor)

        # Use the top predicted class as the target for Grad-CAM.
        class_idx = int(logits.argmax(dim=1).item())
        score = logits[:, class_idx].sum()

        #    with respect to the target layer's feature maps.
        score.backward(retain_graph=False)

        if activations is None or gradients is None:
            raise RuntimeError("Failed to capture activations or gradients for Grad-CAM.")

        # activations: [B, C, H, W], gradients: [B, C, H, W]
        weights = gradients.mean(dim=(2, 3), keepdim=True)  # [B, C, 1, 1]

        # Weighted combination of channels.
        grad_cam = (weights * activations).sum(dim=1, keepdim=True)  # [B, 1, H, W]

        # Apply ReLU to keep only positive contributions.
        grad_cam = F.relu(grad_cam)

        # Remove batch/channel dimensions and convert to numpy.
        cam = grad_cam[0, 0].detach().cpu().numpy()

        # Normalize heatmap between 0 and 1 (requirement).
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max > cam_min:
            cam_norm = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam_norm = np.zeros_like(cam)

        # Keep a copy of normalized heatmap in case callers need raw map later.
        heatmap = cam_norm.astype(np.float32)

        img_rgb = _tensor_to_image_np(image_tensor)
        img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

        # Overlay heatmap onto the original image.
        overlay_bgr = _overlay_heatmap_on_image(img_bgr, heatmap, alpha=0.4)

        # Encode as PNG and then base64.
        success, buffer = cv2.imencode(".png", overlay_bgr)
        if not success:
            raise RuntimeError("Failed to encode Grad-CAM image as PNG.")

        png_bytes: bytes = buffer.tobytes()
        b64_str = base64.b64encode(png_bytes).decode("utf-8")
        return b64_str

    finally:
        # Always remove hooks to avoid memory leaks.
        fwd_handle.remove()
        bwd_handle.remove()

