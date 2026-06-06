"""Export trained models to quantized ONNX for onnxruntime-web."""

import argparse
import json
import shutil
from pathlib import Path


def quantize(path: Path) -> Path:
    from onnxruntime.quantization import QuantType, quantize_dynamic

    out = path.with_name(path.stem + "_int8.onnx")
    quantize_dynamic(str(path), str(out), weight_type=QuantType.QUInt8)
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--localizer", type=Path, default=Path("ml/runs/dog_face_localizer.onnx"))
    parser.add_argument("--landmarks", type=Path, default=Path("ml/runs/dog_landmarks_46.onnx"))
    parser.add_argument("--quantize", action="store_true")
    parser.add_argument("--out", type=Path, default=Path("apps/web/public/models"))
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)

    loc_name = "dog_face_localizer.onnx"
    lm_name = "dog_landmarks_46.onnx"

    if args.localizer.exists():
        dest = args.out / loc_name
        shutil.copy2(args.localizer, dest)
        if args.quantize:
            q = quantize(dest)
            dest = q
            loc_name = q.name
        print(f"Copied localizer -> {dest}")

    if args.landmarks.exists():
        dest = args.out / lm_name
        shutil.copy2(args.landmarks, dest)
        if args.quantize:
            q = quantize(dest)
            dest = q
            lm_name = q.name
        print(f"Copied landmarks -> {dest}")

    manifest = {
        "version": "1.0.0",
        "localizer": loc_name,
        "landmarks": lm_name,
        "localizerInputSize": 224,
        "landmarkInputSize": 384,
    }
    (args.out / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"Updated {args.out / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
