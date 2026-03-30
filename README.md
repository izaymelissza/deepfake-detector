# DeepGuard — Deepfake Detection Web Application

A full-stack web application for detecting deepfake images and videos using EfficientNet-B4 deep learning model.

## Model Performance

- **Accuracy:** 99.73%
- **Precision:** 99.76%
- **Recall:** 99.70%
- **F1 Score:** 99.73%
- **AUC:** 1.0000

## Tech Stack

**Backend:**

- FastAPI
- PyTorch + EfficientNet-B4
- SQLAlchemy + SQLite
- JWT Authentication + Argon2
- Grad-CAM visualization
- OpenCV (video processing)

**Frontend:**

- React + TypeScript
- React Router
- Axios
- react-dropzone

### Prerequisites

- Python 3.9+
- Node.js 18+

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the backend directory:

```
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
```

Run the backend:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`
Swagger UI documentation: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
├── backend/
│   ├── main.py          # FastAPI app, endpoints
│   ├── auth.py          # JWT authentication
│   ├── database.py      # SQLAlchemy models
│   ├── inference.py     # Model inference
│   ├── gradcam.py       # Grad-CAM visualization
│   ├── model.py         # EfficientNet-B4 model
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── context/     # AuthContext
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Features

- Image deepfake detection (JPG, PNG, JPEG, WEBP)
- Video deepfake detection (MP4, MOV, AVI, WEBM)
- Grad-CAM heatmap visualization
- User authentication (register/login)
- Detection history

This project was developed as a BSc thesis at the University of Debrecen.
