"""
AgriHub ConvNeXt Crop Detector Fine-Tuning Script
Fine-tunes the ixrbhii/multicrop-disease-models detector on real field/in-the-wild datasets (e.g. PlantDoc, Kaggle, custom farmer photos).

Usage:
  python finetune_detector.py --data_dir ./dataset --epochs 10 --batch_size 16 --lr 1e-4 --output_dir ./fine_tuned_detector

Directory structure for --data_dir:
  dataset/
    train/
      Maize/
      Rice/
      Soybean/
      Tomato/
      ...
    val/
      Maize/
      Rice/
      ...
"""

import os
import sys
import argparse
import json
import time
from pathlib import Path
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from safetensors.torch import load_file, save_file
import timm
from huggingface_hub import hf_hub_download

REPO_ID = "ixrbhii/multicrop-disease-models"

def parse_args():
    parser = argparse.ArgumentParser(description="Fine-tune AgriHub ConvNeXt Crop Detector")
    parser.add_argument("--data_dir", type=str, default="./dataset", help="Path to dataset root containing 'train' and 'val' subdirectories")
    parser.add_argument("--epochs", type=int, default=10, help="Number of fine-tuning epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size (reduce to 8 if VRAM/RAM is limited)")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate (AdamW)")
    parser.add_argument("--output_dir", type=str, default="./fine_tuned_detector", help="Directory where fine-tuned model and config will be saved")
    parser.add_argument("--freeze_backbone", action="store_true", help="Freeze lower feature backbone layers for faster training on small datasets")
    return parser.parse_args()

def main():
    args = parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🌾 AgriHub Model Fine-Tuner Initializing on device: {device}")

    # 1. Load Base Detector Config and Weights from HuggingFace
    print(f"📥 Loading base model weights from Hugging Face: {REPO_ID} (detectors/new)...")
    config_path = hf_hub_download(repo_id=REPO_ID, filename="detectors/new/config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        base_config = json.load(f)

    weights_path = hf_hub_download(repo_id=REPO_ID, filename="detectors/new/model.safetensors")
    state_dict = load_file(weights_path)

    base_classes = base_config.get("classes", [])
    print(f"Loaded base detector with {len(base_classes)} classes.")

    # 2. Check Dataset
    data_dir = Path(args.data_dir)
    train_dir = data_dir / "train"
    val_dir = data_dir / "val"

    if not train_dir.exists():
        print(f"\n⚠️  Dataset directory '{train_dir}' not found!")
        print("To fine-tune, prepare your dataset in the standard torchvision ImageFolder layout:")
        print(f"  {args.data_dir}/train/<crop_name>/*.jpg")
        print(f"  {args.data_dir}/val/<crop_name>/*.jpg")
        print("\nTip: You can use open field datasets such as:")
        print("  1. PlantDoc (In-the-wild field disease & crop photos): https://github.com/pratikkayal/PlantDoc-Dataset")
        print("  2. PlantVillage (Lab leaf photos): https://github.com/spMohanty/PlantVillage-Dataset")
        print("  3. Custom photos taken directly from your fields (e.g. Maka/Maize, Soybean, Sugarcane).")
        sys.exit(1)

    # 3. Data Transformations with Field Augmentations
    train_transforms = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_dataset = datasets.ImageFolder(str(train_dir), transform=train_transforms)
    dataset_classes = train_dataset.classes
    print(f"Found {len(train_dataset)} training images across {len(dataset_classes)} classes: {dataset_classes}")

    val_loader = None
    if val_dir.exists():
        val_dataset = datasets.ImageFolder(str(val_dir), transform=val_transforms)
        val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False)
        print(f"Found {len(val_dataset)} validation images.")

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)

    # 4. Instantiate Model
    num_classes = len(dataset_classes)
    model = timm.create_model("convnext_small", pretrained=False, num_classes=len(base_classes))
    model.load_state_dict(state_dict, strict=False)

    # Adjust classification head if custom class count differs
    if num_classes != len(base_classes):
        print(f"Reinitializing classification head from {len(base_classes)} to {num_classes} classes...")
        in_features = model.head.fc.in_features
        model.head.fc = nn.Linear(in_features, num_classes)

    if args.freeze_backbone:
        print("Freezing ConvNeXt feature stages, training only head layers...")
        for param in model.stages.parameters():
            param.requires_grad = False

    model = model.to(device)

    # 5. Training Setup
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr, weight_decay=1e-2)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    # 6. Training Loop
    print("\n🚀 Starting Fine-Tuning...")
    best_acc = 0.0
    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        start_time = time.time()

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        scheduler.step()
        epoch_loss = running_loss / total
        epoch_acc = (correct / total) * 100
        elapsed = time.time() - start_time

        val_acc_str = ""
        if val_loader:
            model.eval()
            val_correct = 0
            val_total = 0
            with torch.no_grad():
                for v_images, v_labels in val_loader:
                    v_images, v_labels = v_images.to(device), v_labels.to(device)
                    v_outputs = model(v_images)
                    _, v_preds = torch.max(v_outputs, 1)
                    val_correct += torch.sum(v_preds == v_labels.data).item()
                    val_total += v_labels.size(0)
            val_acc = (val_correct / val_total) * 100
            val_acc_str = f" | Val Acc: {val_acc:.2f}%"

        print(f"Epoch [{epoch:02d}/{args.epochs:02d}] - Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc:.2f}%{val_acc_str} ({elapsed:.1f}s)")

    # 7. Save Fine-Tuned Model Weights & Config
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    weights_out = output_dir / "model.safetensors"
    model_cpu = model.to("cpu")
    save_file(model_cpu.state_dict(), str(weights_out))

    config_out = output_dir / "config.json"
    updated_config = {
        "arch": "convnext_small",
        "classes": dataset_classes,
        "labels": [c.replace("_", " ") for c in dataset_classes],
        "image_size": 224,
        "mean": [0.485, 0.456, 0.406],
        "std": [0.229, 0.224, 0.225],
        "kind": "crop_detector",
        "fine_tuned_date": time.strftime("%Y-%m-%d"),
        "base_model": f"{REPO_ID}/detectors/new"
    }
    with open(config_out, "w", encoding="utf-8") as f:
        json.dump(updated_config, f, indent=2)

    print(f"\n🎉 Fine-Tuning Complete! Artifacts saved to: {output_dir.resolve()}")
    print(f"  - Weights: {weights_out}")
    print(f"  - Config:  {config_out}")

if __name__ == "__main__":
    main()
