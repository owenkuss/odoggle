#!/usr/bin/env python3
"""Train EfficientNetV2-S 46-landmark regressor for DogFLW."""

import argparse
import json
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from PIL import Image


LANDMARK_COUNT = 46


class DogFLWDataset(Dataset):
    def __init__(self, root: Path, split: str, size: int = 384):
        self.root = root / split
        self.size = size
        self.samples: list[tuple[Path, list[float]]] = []
        img_dir = self.root / "images"
        lbl_dir = self.root / "labels"
        if not img_dir.exists():
            return
        for img_path in sorted(img_dir.glob("*")):
            if img_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                continue
            label_path = lbl_dir / f"{img_path.stem}.json"
            if not label_path.exists():
                continue
            meta = json.loads(label_path.read_text())
            landmarks = meta.get("labels") or meta.get("landmarks") or meta.get("keypoints")
            if not landmarks or len(landmarks) < LANDMARK_COUNT:
                continue
            coords: list[float] = []
            for pt in landmarks[:LANDMARK_COUNT]:
                if isinstance(pt, dict):
                    coords.extend([float(pt["x"]), float(pt["y"])])
                else:
                    coords.extend([float(pt[0]), float(pt[1])])
            self.samples.append((img_path, coords))

        self.transform = transforms.Compose(
            [
                transforms.Resize((size, size)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ]
        )

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        img_path, coords = self.samples[idx]
        img = Image.open(img_path).convert("RGB")
        w, h = img.size
        norm = []
        for i in range(0, len(coords), 2):
            norm.extend([coords[i] / w, coords[i + 1] / h])
        tensor = self.transform(img)
        target = torch.tensor(norm, dtype=torch.float32)
        return tensor, target


class LandmarkRegressor(nn.Module):
    def __init__(self, backbone: str = "efficientnet_v2_s"):
        super().__init__()
        if backbone == "efficientnet_v2_s":
            base = models.efficientnet_v2_s(weights=models.EfficientNet_V2_S_Weights.DEFAULT)
            in_features = base.classifier[1].in_features
            base.classifier = nn.Identity()
        else:
            raise ValueError(f"Unknown backbone: {backbone}")
        self.backbone = base
        self.head = nn.Linear(in_features, LANDMARK_COUNT * 2)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feats = self.backbone(x)
        return self.head(feats)


def export_landmarks_onnx(model: nn.Module, out_path: Path, size: int = 384) -> None:
    model.eval()
    dummy = torch.randn(1, 3, size, size)
    torch.onnx.export(
        model,
        dummy,
        str(out_path),
        input_names=["input"],
        output_names=["landmarks"],
        dynamic_axes={"input": {0: "batch"}, "landmarks": {0: "batch"}},
        opset_version=17,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path("ml/data/dogflw"))
    parser.add_argument("--backbone", default="efficientnet_v2_s")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--out", type=Path, default=Path("ml/runs"))
    args = parser.parse_args()

    if not args.data.exists():
        print("Dataset not found. See ml/README.md")
        return 1

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    train_ds = DogFLWDataset(args.data, "train")
    val_ds = DogFLWDataset(args.data, "test")
    if len(train_ds) == 0:
        print("No training samples found — check DogFLW label JSON format.")
        return 1

    train_loader = DataLoader(train_ds, batch_size=args.batch, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch, shuffle=False, num_workers=0)

    model = LandmarkRegressor(args.backbone).to(device)
    optim = torch.optim.AdamW(model.parameters(), lr=args.lr)
    loss_fn = nn.SmoothL1Loss()

    args.out.mkdir(parents=True, exist_ok=True)
    best_val = float("inf")
    ckpt = args.out / "landmarks_best.pt"

    for epoch in range(1, args.epochs + 1):
        model.train()
        train_loss = 0.0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            pred = model(x)
            loss = loss_fn(pred, y)
            optim.zero_grad()
            loss.backward()
            optim.step()
            train_loss += loss.item() * x.size(0)
        train_loss /= len(train_loader.dataset)

        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                val_loss += loss_fn(model(x), y).item() * x.size(0)
        val_loss /= max(len(val_loader.dataset), 1)

        print(f"epoch {epoch}/{args.epochs}  train={train_loss:.5f}  val={val_loss:.5f}")
        if val_loss < best_val:
            best_val = val_loss
            torch.save(model.state_dict(), ckpt)

    model.load_state_dict(torch.load(ckpt, map_location=device))
    onnx_path = args.out / "dog_landmarks_46.onnx"
    export_landmarks_onnx(model, onnx_path)
    print(f"Wrote {onnx_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
