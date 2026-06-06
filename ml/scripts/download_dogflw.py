#!/usr/bin/env python3
"""Download DogFLW dataset into ml/data/dogflw."""

import argparse
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path


def clone_repo(dest: Path) -> bool:
    if dest.exists() and any(dest.iterdir()):
        print(f"Already exists: {dest}")
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    print("Cloning DogFLW from GitHub...")
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", "https://github.com/martvelge/DogFLW", str(dest)],
            check=True,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Git clone failed: {e}")
        return False


def extract_zip(zip_path: Path, dest: Path) -> bool:
    if not zip_path.exists():
        return False
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(dest)
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dest", type=Path, default=Path("ml/data/dogflw"))
    parser.add_argument("--zip", type=Path, help="Local DogFLW zip from Kaggle")
    args = parser.parse_args()

    if args.zip:
        ok = extract_zip(args.zip, args.dest)
        if ok:
            print(f"Extracted to {args.dest}")
            return 0
        print(f"Zip not found: {args.zip}")
        return 1

    if clone_repo(args.dest):
        print(f"DogFLW ready at {args.dest}")
        print("Expected: train/images, train/labels, test/images, test/labels")
        return 0

    print("\nManual download options:")
    print("  git clone https://github.com/martvelge/DogFLW ml/data/dogflw")
    print("  kaggle datasets download -d <dogflw-dataset> -p ml/data && unzip")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
