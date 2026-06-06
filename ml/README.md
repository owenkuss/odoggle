# DogFLW model training

## Quick pipeline

```bash
pip install -r ml/requirements.txt
npm run ml:download    # clone DogFLW (~4k images)
npm run ml:train       # localizer + landmarks + ONNX export
```

Windows:

```powershell
pip install -r ml/requirements.txt
python ml/scripts/download_dogflw.py
python ml/scripts/run_pipeline.py
```

Or: `.\ml\scripts\run_pipeline.ps1`

## Manual steps

### 1. Get the dataset

Images are on **Kaggle** (not in the GitHub repo):

https://www.kaggle.com/datasets/georgemartvel/dogflw

```bash
pip install kaggle
# API token: kaggle.com → Settings → Create New Token → save as ~/.kaggle/kaggle.json
kaggle datasets download -d georgemartvel/dogflw -p ml/data
python ml/scripts/download_dogflw.py --zip ml/data/dogflw.zip
```

Or download the zip manually from Kaggle and pass `--zip path/to/file.zip`.

Expected layout:

```
ml/data/dogflw/
  train/images/
  train/labels/   # JSON per image with 46 landmarks + bbox
  test/images/
  test/labels/
```

### 2. Train

```bash
python ml/train/train.py --epochs 100      # YOLOv8n localizer
python ml/train/landmarks.py --epochs 50     # EfficientNetV2-S regressor
```

Requires GPU recommended. CPU training is very slow.

### 3. Export ONNX for browser

```bash
python ml/export/to_onnx.py --quantize
```

Outputs to `apps/web/public/models/`:
- `dog_face_localizer.onnx` (~16MB quantized)
- `dog_landmarks_46.onnx` (~55MB quantized)
- `manifest.json`

### 4. Production CDN

Upload ONNX files to R2/Vercel Blob with long cache headers. Update manifest paths if using external CDN.

Until models are present, the web app uses heuristic fallback for Camera Check and The Lab.
