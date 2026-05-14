import os
import shutil
import random

# 🔹 CHANGE THIS TO YOUR ACTUAL PATH
BASE_DATASET = r"D:\AAROH\ai_model\dataset\classification"

TRAIN_SOURCE = os.path.join(BASE_DATASET, "train")
VAL_SOURCE = os.path.join(BASE_DATASET, "val")

OUTPUT_BASE = r"D:\AAROH_PROJECT\training\processed_dataset"

TRAIN_OUTPUT = os.path.join(OUTPUT_BASE, "train")
VAL_OUTPUT = os.path.join(OUTPUT_BASE, "val")

os.makedirs(TRAIN_OUTPUT, exist_ok=True)
os.makedirs(VAL_OUTPUT, exist_ok=True)

all_classes = [
    cls for cls in os.listdir(TRAIN_SOURCE)
    if os.path.isdir(os.path.join(TRAIN_SOURCE, cls))
]

print("Total classes available:", len(all_classes))

if len(all_classes) < 40:
    raise ValueError("Less than 40 classes found!")

selected_classes = random.sample(all_classes, 40)

print("Selected Classes:")
print(selected_classes)

for cls in selected_classes:
    src_train = os.path.join(TRAIN_SOURCE, cls)
    dst_train = os.path.join(TRAIN_OUTPUT, cls)

    os.makedirs(dst_train, exist_ok=True)

    images = os.listdir(src_train)

    # Reduce to 600 if more
    if len(images) > 600:
        images = random.sample(images, 600)

    for img in images:
        shutil.copy(
            os.path.join(src_train, img),
            os.path.join(dst_train, img)
        )

print("✅ Train images prepared")

for cls in selected_classes:
    src_val = os.path.join(VAL_SOURCE, cls)
    dst_val = os.path.join(VAL_OUTPUT, cls)

    if not os.path.exists(src_val):
        continue

    os.makedirs(dst_val, exist_ok=True)

    val_images = os.listdir(src_val)

    # Optional: reduce val to 150 max
    if len(val_images) > 150:
        val_images = random.sample(val_images, 150)

    for img in val_images:
        shutil.copy(
            os.path.join(src_val, img),
            os.path.join(dst_val, img)
        )

print("✅ Validation images prepared")

print("🎯 Dataset ready for training!")