import json
import os
from functools import lru_cache

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image


CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(CURRENT_DIR, "model")
WEIGHTS_PATH = os.path.join(MODEL_DIR, "aaroh_model.pth")
CLASS_MAPPING_PATH = os.path.join(MODEL_DIR, "class_mapping.json")


@lru_cache(maxsize=1)
def get_bundle() -> dict:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    preprocess = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )

    if not os.path.exists(CLASS_MAPPING_PATH):
        raise FileNotFoundError(f"class_mapping.json not found at: {CLASS_MAPPING_PATH}")
    with open(CLASS_MAPPING_PATH, "r", encoding="utf-8") as f:
        class_mapping = json.load(f)

    if not os.path.exists(WEIGHTS_PATH):
        raise FileNotFoundError(f"aaroh_model.pth not found at: {WEIGHTS_PATH}")

    try:
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    except Exception:
        model = models.mobilenet_v2(pretrained=True)

    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, 40)

    state_dict = torch.load(WEIGHTS_PATH, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()

    return {"device": device, "preprocess": preprocess, "class_mapping": class_mapping, "model": model}


def predict_pest(pil_image: Image.Image) -> dict:
    b = get_bundle()
    device = b["device"]
    preprocess = b["preprocess"]
    model = b["model"]
    class_mapping: dict = b["class_mapping"]

    img = pil_image.convert("RGB")
    input_tensor = preprocess(img).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(input_tensor)
        probs = torch.softmax(logits, dim=1)
        conf, pred_idx = torch.max(probs, dim=1)

    pred_idx_int = int(pred_idx.item())
    confidence = float(conf.item())
    pest_name = class_mapping.get(str(pred_idx_int), str(pred_idx_int))
    return {"pest": str(pest_name), "confidence": float(round(confidence, 4))}

