# Setup Guide for Running Medical Camp Web App Locally

This guide provides instructions on how to set up and run the Medical Camp Web App locally on your machine.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js and npm:** [Download and install Node.js](https://nodejs.org/en/download/) (npm is included with Node.js).
*   **MongoDB:** [Install MongoDB Community Server](https://docs.mongodb.com/manual/installation/)
*   **Git:** [Download and install Git](https://git-scm.com/downloads)

## 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone https://code.swecha.org/healthcare/medical-camp/medical-camp-web-app.git
cd medical-camp-web-app
```

## 2. Backend Setup

Navigate to the `backend` directory and install the dependencies.

```bash
cd backend
npm install
```

### Configure Environment Variables

Create a `.env` file in the `backend` directory based on `backend/.env.example`.

```bash
cp .env.example .env
```

Edit the `.env` file and set your MongoDB connection string (e.g., `MONGO_URI=mongodb://localhost:27017/medicalcamp`).

### Enable Localhost in `backend/server.js`

Open `backend/server.js` and uncomment the `http://localhost:3000` origin for CORS.

```javascript
// backend/server.js
app.use(cors({
  // origin: 'https://medical-camp.apps.swecha.org', // or your frontend domain
  origin: 'http://localhost:3000',// or your frontend domain
  credentials: true
}));
```

### Start the Backend Server

```bash
npm run dev
```

The backend server should now be running on `http://localhost:5002`.

## 3. Frontend Setup

Open a new terminal, navigate to the `frontend` directory, and install the dependencies.

```bash
cd ../frontend
npm install
```

### Enable Localhost in `frontend/src/api/axios.js`

Open `frontend/src/api/axios.js` and uncomment the `http://localhost:5002` URL for the backend API.

```javascript
// frontend/src/api/axios.js
const BACKEND_URL = 'http://localhost:5002';
//const BACKEND_URL = 'https://be-medical-camp.apps.swecha.org';
```

### Start the Frontend Development Server

```bash
npm start
```

The frontend application should now be running on `http://localhost:3000`.

## 4. Access the Application

Open your web browser and navigate to `http://localhost:3000` to access the Medical Camp Web App.
