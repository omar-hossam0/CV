# ML Service (FastAPI)

- Runs on `http://127.0.0.1:5000`
- Loads model from `cv_job_matcher_final.pkl` in this folder by default. Override with env `MODEL_PATH`.

## Install & Run
```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
$env:MODEL_PATH = 'cv_job_matcher_final.pkl'  # optional
python main.py
```

## Endpoint
- `POST /predict` form-data with key `file`
- Returns JSON with `match`, `score`, `details` when available.

## Supported Files
- PDF: requires `pdfminer.six`
- DOCX: requires `python-docx`
- TXT: plain text

If you need DOC (old Word format), convert to DOCX or PDF first.
