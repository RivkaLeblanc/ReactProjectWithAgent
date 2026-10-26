# SNOW GOOD

SNOW GOOD is a ski-equipment shop demo built with React, TypeScript, Vite, and React Router. It includes product browsing and filtering, product details, customer reviews, demo registration/login, and an AI-assisted product creation flow.

## Features

- Browse products by category and filter by gender or name.
- View product details and add, edit, and delete reviews.
- Register a demo account and view/update profile details.
- Use the admin product form or the AI product agent to add products.
- The AI service uses FastAPI and OpenAI; the app's product, user, and review data is provided by JSON Server.

## Requirements

- Node.js and npm
- Python 3.10+
- An OpenAI API key to use the AI product agent

## Run locally

### 1. Install dependencies

From the repository root:

```bash
npm install
```

Then install the JSON Server dependencies:

```bash
cd json-server
npm install
cd ..
```

### 2. Configure the demo data and frontend API URL

From the repository root, copy the sample database and environment file:

```powershell
Copy-Item json-server/db.example.json json-server/db.json
Copy-Item .env.example .env
```

`json-server/db.json` is local demo data and is intentionally excluded from git. The sample includes demo users with plaintext passwords; do not use real credentials or deploy this setup.

### 3. Start the JSON API

In a terminal:

```bash
cd json-server
npm run dev
```

The API is available at `http://localhost:5000`.

### 4. Start the React app

In another terminal at the repository root:

```bash
npm run dev
```

Open `http://localhost:5173`.

### 5. (Optional) Start the AI product service

Create `LLM/.env` with your own key:

```env
OPENAI_API_KEY=your-openai-api-key
```

Install and run the Python service:

```bash
cd LLM
python -m venv .venv
```

Activate the virtual environment:

```powershell
.venv\Scripts\Activate.ps1
```

On macOS/Linux, use `source .venv/bin/activate`. Then install and start the service:

```bash
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

The AI agent is available at `http://localhost:8000`. It also requires the JSON API to be running. Never commit `.env` files or share API keys.

## Demo accounts

The sample database contains:

- Admin: `admin@snowgood.test` / `Admin123!`
- Customer: `customer@snowgood.test` / `Customer123!`

These credentials are only for local demonstration.

## API overview

The browser app uses `fetch` with JSON Server resources such as `/SKIES`, `/BOOTS`, `/GOGGLES`, `/users`, and `/reviews`. The AI product flow calls the FastAPI `POST /analyze`, `POST /message`, and `POST /confirm` endpoints.

## Demo limitations

This is a portfolio demo, not a production store. Authentication and role checks are client-side only, and the sample JSON database stores demo passwords in plaintext. Do not use it with real accounts or deploy it publicly without implementing server-side authentication, authorization, secure password hashing, and persistent production storage.
