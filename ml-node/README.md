# ML Node Bridge (Express)

- Runs on `http://127.0.0.1:3000`
- Forwards uploaded CV to FastAPI at `http://127.0.0.1:5000/predict`

## Install & Run
```powershell
npm install
npm run dev
```
Optionally set env:
```powershell
$env:PORT = 3000
$env:ML_HOST = 'http://127.0.0.1:5000'
```

## Endpoint
- `POST /match` form-data with key `cvFile`
- Returns the JSON from ML service

## Test
```powershell
curl -X POST http://127.0.0.1:3000/match -F "cvFile=@d:/path/to/cv.pdf"
```
