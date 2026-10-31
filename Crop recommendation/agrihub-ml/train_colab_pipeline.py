"""
AgriHub Multi-Crop ConvNeXt Fine-Tuning Pipeline
Streamlines datasets directly from Kaggle (PlantDoc & PlantVillage) via kagglehub,
unifies classes into the 36-crop taxonomy, and fine-tunes ConvNeXt for in-field accuracy.

Designed to run on Google Colab or Kaggle (Free GPU).
"""

import os
import sys
import json
import time
import shutil
import random
from pathlib import Path
from typing import List, Tuple, Dict, Any

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
from safetensors.torch import load_file, save_file
import timm
from huggingface_hub import hf_hub_download

# Canonical 36 crop classes matching ixrbhii/multicrop-disease-models detectors/new
CANONICAL_CLASSES = [
    'Apple', 'Apricot', 'Betel', 'Bitter_gourd', 'Black_Pepper', 
    'Bottle_gourd', 'Cashew', 'Cassava', 'Cherry', 'Chrysanthemum', 
    'Citrus', 'Coffee', 'Cucumber', 'Cucurbit', 'Fig', 'Grape', 
    'Loquat', 'Maize', 'Mango', 'Peach', 'Pear', 'Pepper', 'Potato', 
    'Raspberry', 'Rice', 'Ridge_gourd', 'Rose', 'Snake_gourd', 
    'Sorghum', 'Soybean', 'Squash', 'Strawberry', 'Sugarcane', 
    'Tea', 'Tomato', 'Walnut'
]

CLASS_TO_IDX = {name: idx for idx, name in enumerate(CANONICAL_CLASSES)}

# Multi-lingual & dataset folder alias map to canonical class
CROP_ALIAS_MAP = {
    # Maize / Corn / Maka
    "maize": "Maize",
    "corn": "Maize",
    "maka": "Maize",
    "makka": "Maize",
    "zea mays": "Maize",
    # Rice / Paddy / Bhat
    "rice": "Rice",
    "paddy": "Rice",
    "bhat": "Rice",
    "oryza sativa": "Rice",
    # Soybean
    "soybean": "Soybean",
    "soy": "Soybean",
    # Tomato
    "tomato": "Tomato",
    # Potato
    "potato": "Potato",
    # Grape
    "grape": "Grape",
    "grapes": "Grape",
    # Citrus / Orange / Lemon
    "citrus": "Citrus",
    "orange": "Citrus",
    "lemon": "Citrus",
    "lime": "Citrus",
    # Pepper
    "pepper": "Pepper",
    "bell pepper": "Pepper",
    # Apple
    "apple": "Apple",
    # Cherry
    "cherry": "Cherry",
    # Peach
    "peach": "Peach",
    # Strawberry
    "strawberry": "Strawberry",
    # Squash
    "squash": "Squash",
    # Sugarcane
    "sugarcane": "Sugarcane",
    # Mango
    "mango": "Mango",
    # Raspberry
    "raspberry": "Raspberry"
}

def map_folder_to_crop(folder_name: str) -> str:
    """Maps arbitrary folder names (from PlantVillage or PlantDoc) to canonical class."""
    clean = folder_name.lower().replace("_", " ").replace("-", " ")
    # Exact or substring check
    for alias, canonical in CROP_ALIAS_MAP.items():
        if alias in clean:
            return canonical
    return None

class UnifiedPlantDataset(Dataset):
    """PyTorch Dataset loading images from mapped PlantDoc and PlantVillage directories."""
    def __init__(self, samples: List[Tuple[str, int, str]], transform=None):
        self.samples = samples  # (filepath, class_idx, source_dataset)
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label, _ = self.samples[idx]
        try:
            image = Image.open(path).convert("RGB")
        except Exception:
            # Fallback for corrupted images
            image = Image.new("RGB", (224, 224), color=(0, 0, 0))
            
        if self.transform:
            image = self.transform(image)
        return image, label

def scan_plantdoc(root_dir: str) -> List[Tuple[str, int, str]]:
    """Discovers in-the-wild field condition images from PlantDoc."""
    samples = []
    root = Path(root_dir)
    print(f"🔍 Scanning PlantDoc dataset at: {root}...")
    
    # Typical extensions
    img_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in img_exts:
            # Look at immediate parent folder and grand-parent folder
            parent_name = path.parent.name
            crop = map_folder_to_crop(parent_name)
            if not crop and path.parent.parent:
                crop = map_folder_to_crop(path.parent.parent.name)
            
            if crop and crop in CLASS_TO_IDX:
                samples.append((str(path), CLASS_TO_IDX[crop], "PlantDoc_Field"))
                
    print(f"✓ Found {len(samples)} field images in PlantDoc across mapped classes.")
    return samples

def scan_plantvillage(root_dir: str, max_per_class: int = 600) -> List[Tuple[str, int, str]]:
    """Discovers studio/lab leaf images from PlantVillage with per-class capping for balance."""
    samples = []
    root = Path(root_dir)
    print(f"🔍 Scanning PlantVillage dataset at: {root}...")
    
    img_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    class_counts = {}
    
    # Prefer 'color' subfolder if exists
    target_root = root / "color" if (root / "color").exists() else root
    
    for path in target_root.rglob("*"):
        if path.is_file() and path.suffix.lower() in img_exts:
            parent_name = path.parent.name
            crop = map_folder_to_crop(parent_name)
            if crop and crop in CLASS_TO_IDX:
                current_count = class_counts.get(crop, 0)
                if current_count < max_per_class:
                    samples.append((str(path), CLASS_TO_IDX[crop], "PlantVillage_Lab"))
                    class_counts[crop] = current_count + 1
                    
    print(f"✓ Found {len(samples)} lab images in PlantVillage (balanced up to {max_per_class} per class).")
    return samples

def split_dataset(all_samples: List[Tuple[str, int, str]], val_ratio: float = 0.15, seed: int = 42):
    """Stratified train/validation split keeping class and source distribution."""
    random.seed(seed)
    by_class_source = {}
    for item in all_samples:
        key = (item[1], item[2]) # (class_idx, source)
        by_class_source.setdefault(key, []).append(item)
        
    train_samples = []
    val_samples = []
    
    for key, items in by_class_source.items():
        random.shuffle(items)
        n_val = max(1, int(len(items) * val_ratio))
        val_samples.extend(items[:n_val])
        train_samples.extend(items[n_val:])
        
    random.shuffle(train_samples)
    random.shuffle(val_samples)
    return train_samples, val_samples

def build_model(device: torch.device, repo_id: str = "ixrbhii/multicrop-disease-models"):
    """Loads timm convnext_small with the pretrained Hugging Face detector weights."""
    print("📥 Loading base ConvNeXt model architecture...")
    model = timm.create_model("convnext_small", pretrained=False, num_classes=len(CANONICAL_CLASSES))
    
    print(f"📥 Downloading base weights from Hugging Face: {repo_id} (detectors/new)...")
    weights_path = hf_hub_download(repo_id=repo_id, filename="detectors/new/model.safetensors")
    state_dict = load_file(weights_path)
    model.load_state_dict(state_dict)
    model.to(device)
    print("✓ Pretrained ConvNeXt detector weights loaded successfully into model.")
    return model

def get_transforms():
    """Field-specific data augmentations for sunlight, leaf angles, and scale."""
    train_transforms = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomResizedCrop(224, scale=(0.6, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=20),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.25, hue=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    return train_transforms, val_transforms

def train_detector(
    plantdoc_path: str,
    plantvillage_path: str,
    output_dir: str = "./agrihub_finetuned_detector",
    epochs: int = 10,
    batch_size: int = 16,
    lr: float = 1e-4,
    freeze_backbone_stages: int = 2
):
    """End-to-end fine-tuning routine."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n=======================================================")
    print(f"🌾 AgriHub ConvNeXt Crop Detector Training on: {device}")
    print(f"=======================================================")
    
    # 1. Discover samples
    doc_samples = scan_plantdoc(plantdoc_path)
    village_samples = scan_plantvillage(plantvillage_path)
    all_samples = doc_samples + village_samples
    
    if not all_samples:
        raise ValueError("No matching images found! Please check Kaggle dataset paths.")
        
    train_samples, val_samples = split_dataset(all_samples, val_ratio=0.15)
    print(f"📊 Total Dataset: {len(all_samples)} images ({len(train_samples)} Train, {len(val_samples)} Val)")
    
    # 2. DataLoaders
    train_tf, val_tf = get_transforms()
    train_loader = DataLoader(
        UnifiedPlantDataset(train_samples, transform=train_tf),
        batch_size=batch_size,
        shuffle=True,
        num_workers=2,
        pin_memory=torch.cuda.is_available()
    )
    val_loader = DataLoader(
        UnifiedPlantDataset(val_samples, transform=val_tf),
        batch_size=batch_size,
        shuffle=False,
        num_workers=2,
        pin_memory=torch.cuda.is_available()
    )
    
    # 3. Model & Freezing
    model = build_model(device)
    
    if freeze_backbone_stages > 0:
        print(f"🔒 Freezing lower backbone stages (0 to {freeze_backbone_stages - 1}) for faster training...")
        for name, param in model.named_parameters():
            if any(f"stages.{s}." in name for s in range(freeze_backbone_stages)) or "stem." in name:
                param.requires_grad = False
                
    # 4. Optimizer & Loss
    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(trainable_params, lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    criterion = nn.CrossEntropyLoss()
    scaler = torch.amp.GradScaler('cuda') if torch.cuda.is_available() else None
    
    # 5. Training Loop
    best_val_acc = 0.0
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    print("\n🚀 Starting Fine-Tuning Loop...")
    for epoch in range(1, epochs + 1):
        start_time = time.time()
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            
            if scaler:
                with torch.amp.autocast('cuda'):
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            else:
                outputs = model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                
            total_loss += loss.item() * images.size(0)
            preds = outputs.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            
        scheduler.step()
        train_loss = total_loss / total
        train_acc = (correct / total) * 100.0
        
        # Validation
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                if scaler:
                    with torch.amp.autocast('cuda'):
                        outputs = model(images)
                        loss = criterion(outputs, labels)
                else:
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                    
                val_loss += loss.item() * images.size(0)
                preds = outputs.argmax(dim=1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)
                
        val_loss = val_loss / val_total
        val_acc = (val_correct / val_total) * 100.0
        elapsed = time.time() - start_time
        
        print(f"Epoch [{epoch:02d}/{epochs:02d}] ({elapsed:.1f}s) | "
              f"Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss:.4f} Acc: {val_acc:.2f}%")
              
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            # Save checkpoint
            save_file(model.state_dict(), str(out_path / "model.safetensors"))
            print(f"  ⭐ Best Model Saved! Val Acc: {best_val_acc:.2f}%")
            
    # Save config.json
    config_dict = {
        "model_architecture": "convnext_small",
        "num_classes": len(CANONICAL_CLASSES),
        "classes": CANONICAL_CLASSES,
        "best_val_accuracy_pct": round(best_val_acc, 2),
        "training_epochs": epochs,
        "date_trained": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(out_path / "config.json", "w", encoding="utf-8") as f:
        json.dump(config_dict, f, indent=2)
        
    print(f"\n✅ Fine-Tuning Complete! Artifacts saved to: {out_path.absolute()}")
    return out_path

