#!/usr/bin/env python3
"""Run full ML pipeline: download (optional) -> train localizer -> train landmarks -> export ONNX."""

import argparse
import subprocess
import sys
from pathlib import Path


def run(cmd: list[str]) -> int:
    print(f"\n>> {' '.join(cmd)}")
    return subprocess.call(cmd)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--localizer-epochs", type=int, default=100)
    parser.add_argument("--landmark-epochs", type=int, default=50)
    parser.add_argument("--quantize", action="store_true", default=True)
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2]
    data = root / "ml" / "data" / "dogflw"

    if not args.skip_download and not data.exists():
        code = run([sys.executable, str(root / "ml/scripts/download_dogflw.py")])
        if code != 0:
            return code

    if not data.exists():
        print("Dataset missing. Run: python ml/scripts/download_dogflw.py")
        return 1

    if run([sys.executable, str(root / "ml/train/train.py"), "--epochs", str(args.localizer_epochs)]):
        return 1

    if run([sys.executable, str(root / "ml/train/landmarks.py"), "--epochs", str(args.landmark_epochs)]):
        return 1

    export_cmd = [sys.executable, str(root / "ml/export/to_onnx.py")]
    if args.quantize:
        export_cmd.append("--quantize")
    if run(export_cmd):
        return 1

    print("\nDone. Models in apps/web/public/models/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
