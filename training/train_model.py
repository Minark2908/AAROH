import os
import json
import time

import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Your processed dataset is inside the "training" folder:
    # D:\AAROH_PROJECT\training\processed_dataset\train
    # D:\AAROH_PROJECT\training\processed_dataset\val
    train_dir = os.path.join(current_dir, "processed_dataset", "train")
    val_dir = os.path.join(current_dir, "processed_dataset", "val")

    # Path to save the trained model and class mapping
    save_dir = os.path.join(current_dir, "saved_models")
    os.makedirs(save_dir, exist_ok=True)

    model_path = os.path.join(save_dir, "aaroh_model.pth")
    class_mapping_path = os.path.join(save_dir, "class_mapping.json")

    # Training settings
    batch_size = 16  # Small batch size suitable for CPU

    # Two-stage training (simple and effective):
    # Stage 1: train only the classifier (fast and stable)
    # Stage 2: unfreeze last few backbone layers and fine-tune (better accuracy)
    classifier_epochs = 5
    finetune_epochs = 8
    total_epochs = classifier_epochs + finetune_epochs

    lr_classifier = 0.001
    lr_finetune = 0.0001

    # Use GPU if available, otherwise CPU.
    # Even though you mainly have CPU, this makes the code more general.
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # These transforms resize images to 224x224 (required by MobileNetV2)
    # and normalize them with standard ImageNet statistics.
    train_transforms = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),  # simple augmentation
        transforms.RandomHorizontalFlip(),  # simple augmentation
        transforms.RandomRotation(10),  # small rotation helps generalization
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    val_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    # ImageFolder automatically reads class folders
    train_dataset = datasets.ImageFolder(root=train_dir, transform=train_transforms)
    val_dataset = datasets.ImageFolder(root=val_dir, transform=val_transforms)

    train_loader = torch.utils.data.DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0  # 0 is safest on Windows for beginners
    )

    val_loader = torch.utils.data.DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0
    )

    num_classes = len(train_dataset.classes)
    print(f"Number of classes: {num_classes}")
    print(f"Classes: {train_dataset.classes}")

    # ImageFolder assigns an index to each class, stored in class_to_idx.
    # We invert this to get a simple mapping from index to class name.
    idx_to_class = {idx: class_name for class_name, idx in train_dataset.class_to_idx.items()}

    with open(class_mapping_path, "w") as f:
        json.dump(idx_to_class, f, indent=4)

    print(f"Saved class mapping to: {class_mapping_path}")

    # Load pretrained MobileNetV2 (ImageNet weights)
    # (This try/except keeps the script compatible with different torchvision versions.)
    try:
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    except Exception:
        model = models.mobilenet_v2(pretrained=True)

    # Freeze the backbone (features) so only the classifier is trained (Stage 1)
    # Freezing means we do NOT update these weights during backpropagation.
    for param in model.features.parameters():
        param.requires_grad = False

    # Replace the last classifier layer to match our number of classes
    # MobileNetV2 classifier is usually: Dropout -> Linear
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)

    model = model.to(device)

    criterion = nn.CrossEntropyLoss()

    # We will create optimizers separately for Stage 1 and Stage 2.
    # Using Adam is simple and usually works well for fine-tuning.
    optimizer = optim.Adam(model.classifier.parameters(), lr=lr_classifier)

    best_val_acc = 0.0

    for epoch in range(total_epochs):
        start_time = time.time()

        if epoch == classifier_epochs:
            print("\n--- Fine-tuning stage started ---")
            print("Unfreezing last 3 feature blocks and using a smaller learning rate.")

            # Unfreeze the last few feature blocks (Stage 2)
            # This lets the model adapt better to your pest dataset.
            last_n_blocks_to_unfreeze = 3
            for layer in model.features[-last_n_blocks_to_unfreeze:]:
                for param in layer.parameters():
                    param.requires_grad = True

            # New optimizer for fine-tuning:
            # It will update BOTH the classifier and the unfrozen backbone layers.
            trainable_params = [p for p in model.parameters() if p.requires_grad]
            optimizer = optim.Adam(trainable_params, lr=lr_finetune)

        stage_name = "Classifier training" if epoch < classifier_epochs else "Fine-tuning"
        print(f"\nEpoch [{epoch + 1}/{total_epochs}]  -  {stage_name}")

        # ----- Training phase -----
        model.train()  # Set model to training mode
        running_loss = 0.0
        running_corrects = 0
        running_samples = 0

        for inputs, labels in train_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            # Zero the gradients
            optimizer.zero_grad()

            # Forward pass
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)

            # Backward pass and optimize
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data).item()
            running_samples += inputs.size(0)

        train_loss = running_loss / running_samples
        train_acc = running_corrects / running_samples

        # ----- Validation phase -----
        model.eval()  # Set model to evaluation mode
        val_running_loss = 0.0
        val_running_corrects = 0
        val_running_samples = 0

        # We do not need gradients during validation
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device)
                labels = labels.to(device)

                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)

                val_running_loss += loss.item() * inputs.size(0)
                val_running_corrects += torch.sum(preds == labels.data).item()
                val_running_samples += inputs.size(0)

        val_loss = val_running_loss / val_running_samples
        val_acc = val_running_corrects / val_running_samples

        epoch_time = time.time() - start_time

        # Print results for this epoch
        print(f"Train Loss: {train_loss:.4f}  |  Train Acc: {train_acc*100:.2f}%")
        print(f"Val   Loss: {val_loss:.4f}  |  Val   Acc: {val_acc*100:.2f}%")
        print(f"Epoch time: {epoch_time:.1f} seconds")

        # Save the best model (simple way to keep the highest validation accuracy)
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), model_path)
            print(f"Saved best model so far (Val Acc: {best_val_acc*100:.2f}%) -> {model_path}")

    # We already saved the best model during training.
    print(f"\nTraining complete. Best Val Acc: {best_val_acc*100:.2f}%")
    print(f"Best model saved at: {model_path}")

if __name__ == "__main__":
    main()