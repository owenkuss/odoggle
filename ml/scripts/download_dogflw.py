#!/usr/bin/env python3
"""Download DogFLW dataset into ml/data/dogflw."""

import argparse
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

KAGGLE_DATASET = "georgemartvel/dogflw"
KAGGLE_URL = "https://www.kaggle.com/datasets/georgemartvel/dogflw"


def has_images(dest: Path) -> bool:
    train_imgs = dest / "train" / "images"
    return train_imgs.exists() and any(train_imgs.glob("*"))


def clone_repo(dest: Path) -> bool:
    if (dest / "README.md").exists():
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    print("Cloning DogFLW docs from GitHub...")
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", "https://github.com/martvelge/DogFLW", str(dest)],
            check=True,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Git clone failed: {e}")
        return False


def download_kaggle(dest: Path) -> bool:
    try:
        subprocess.run(["kaggle", "datasets", "download", "-d", KAGGLE_DATASET, "-p", str(dest.parent)], check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

    zip_path = dest.parent / "dogflw.zip"
    if not zip_path.exists():
        for z in dest.parent.glob("*.zip"):
            zip_path = z
            break
    if not zip_path.exists():
        return False

    extract_to = dest.parent / "_kaggle_extract"
    extract_to.mkdir(exist_ok=True)
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(extract_to)

    # Flatten common Kaggle layouts into ml/data/dogflw/train|test
    for split in ("train", "test"):
        for candidate in extract_to.rglob(split):
            if candidate.is_dir() and (candidate / "images").exists():
                target = dest / split
                if target.exists():
                    shutil.rmtree(target)
                shutil.copytree(candidate, target)
                return True
    return has_images(dest)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dest", type=Path, default=Path("ml/data/dogflw"))
    parser.add_argument("--zip", type=Path, help="Local DogFLW zip from Kaggle")
    args = parser.parse_args()

    if args.zip:
        extract_to = args.dest.parent / "_local_extract"
        extract_to.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(args.zip) as zf:
            zf.extractall(extract_to)
        print(f"Extracted to {extract_to} — move train/test into {args.dest}")
        return 0

    clone_repo(args.dest)

    if has_images(args.dest):
        print(f"DogFLW images ready at {args.dest}")
        return 0

    print("\nDogFLW images are NOT in the GitHub repo.")
    print(f"Download from Kaggle: {KAGGLE_URL}")
    print("\nOption A — Kaggle CLI:")
    print("  pip install kaggle")
    print("  # Place kaggle.json in ~/.kaggle/ (API token from kaggle.com/settings)")
    print(f"  kaggle datasets download -d {KAGGLE_DATASET} -p ml/data")
    print("  python ml/scripts/download_dogflw.py --zip ml/data/dogflw.zip")
    print("\nOption B — Manual:")
    print("  1. Download zip from Kaggle website")
    print("  2. python ml/scripts/download_dogflw.py --zip path/to/dogflw.zip")

    if download_kaggle(args.dest):
        print(f"\nKaggle download OK: {args.dest}")
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
