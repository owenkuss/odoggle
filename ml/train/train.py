#!/usr/bin/env python3
"""Train YOLOv8n dog face localizer on DogFLW bounding boxes."""

import argparse
import json
import shutil
from pathlib import Path


def prepare_yolo_dataset(data_dir: Path, out_dir: Path) -> Path:
    """Convert DogFLW JSON labels to YOLO format (single class: dog_face)."""
    import yaml

    yolo_root = out_dir / "yolo_dogflw"
    for split in ("train", "val"):
        (yolo_root / split / "images").mkdir(parents=True, exist_ok=True)
        (yolo_root / split / "labels").mkdir(parents=True, exist_ok=True)

    for split, src_split in (("train", "train"), ("val", "test")):
        img_dir = data_dir / src_split / "images"
        lbl_dir = data_dir / src_split / "labels"
        if not img_dir.exists():
            continue
        for img_path in img_dir.glob("*"):
            if img_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                continue
            label_path = lbl_dir / f"{img_path.stem}.json"
            if not label_path.exists():
                label_path = lbl_dir / f"{img_path.stem}.txt"
            if not label_path.exists():
                continue

            meta = json.loads(label_path.read_text()) if label_path.suffix == ".json" else None
            if meta:
                bbox = meta.get("bounding_boxes") or meta.get("bbox") or meta.get("bounding_box")
                if not bbox or len(bbox) != 4:
                    continue
                from PIL import Image

                with Image.open(img_path) as im:
                    img_w, img_h = im.size
                x1, y1, x2, y2 = map(float, bbox)
                cx = ((x1 + x2) / 2) / img_w
                cy = ((y1 + y2) / 2) / img_h
                nw = (x2 - x1) / img_w
                nh = (y2 - y1) / img_h
            else:
                parts = label_path.read_text().strip().split()
                if len(parts) < 5:
                    continue
                cx, cy, nw, nh = map(float, parts[1:5])

            dest_img = yolo_root / split / "images" / img_path.name
            dest_lbl = yolo_root / split / "labels" / f"{img_path.stem}.txt"
            if not dest_img.exists():
                shutil.copy2(img_path, dest_img)
            dest_lbl.write_text(f"0 {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}\n")

    yaml_path = yolo_root / "dogflw.yaml"
    yaml_path.write_text(
        yaml.safe_dump(
            {
                "path": str(yolo_root.resolve()),
                "train": "train/images",
                "val": "val/images",
                "names": {0: "dog_face"},
            }
        )
    )
    return yaml_path


def export_localizer_onnx(weights: Path, out_dir: Path) -> Path:
    from ultralytics import YOLO

    model = YOLO(str(weights))
    export_path = model.export(format="onnx", imgsz=224, simplify=True)
    dest = out_dir / "dog_face_localizer.onnx"
    shutil.copy2(export_path, dest)
    return dest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path("ml/data/dogflw"))
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--out", type=Path, default=Path("ml/runs"))
    parser.add_argument("--skip-train", action="store_true")
    args = parser.parse_args()

    if not args.data.exists():
        print("Dataset not found. Download DogFLW:")
        print("  git clone https://github.com/martvelge/DogFLW ml/data/dogflw")
        return 1

    args.out.mkdir(parents=True, exist_ok=True)
    yaml_path = prepare_yolo_dataset(args.data, args.out)

    weights = args.out / "localizer" / "weights" / "best.pt"
    if not args.skip_train:
        from ultralytics import YOLO

        print(f"Training YOLOv8n on {yaml_path} for {args.epochs} epochs...")
        model = YOLO("yolov8n.pt")
        model.train(
            data=str(yaml_path),
            epochs=args.epochs,
            imgsz=224,
            batch=16,
            project=str(args.out / "localizer"),
            name="train",
            exist_ok=True,
        )

    if not weights.exists():
        print(f"Weights not found at {weights}")
        return 1

    print("Exporting localizer to ONNX...")
    onnx_path = export_localizer_onnx(weights, args.out)
    print(f"Wrote {onnx_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
