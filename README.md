# Paddy AI — AI-Based Smart Paddy Farming System

Paddy AI is a multilingual decision-support web application for Sri Lankan paddy farmers. The system combines a React/Vite frontend, Spring Boot REST backend, MySQL database and an independent Python FastAPI ML service.

## Main features

- Secure registration and JWT login
- Forgot / reset password by email
- Land suitability prediction
- Paddy disease detection from leaf images
- Irrigation recommendation
- Fertilizer recommendation
- Yield prediction
- Pest-risk assessment
- Weather advisory
- Farm and farm-activity management
- Prediction history and PDF export
- Farmer feedback on AI predictions
- Live in-app notifications
- Account-scoped profile and avatar storage
- English, Sinhala and Tamil user interface
- Role-protected Admin Panel
- Responsive desktop, tablet and mobile interface

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios, React Hot Toast |
| Backend | Java 17, Spring Boot, Spring Security, JWT, Spring Data JPA |
| Database | MySQL 8 |
| ML API | Python, FastAPI, scikit-learn, TensorFlow/Keras |

## Project structure

```text
frontend/       React/Vite user interface
backend/        Spring Boot REST API
ml-module/      Python FastAPI prediction service
paddy_ai_db.sql Database setup/sample schema
```

## Prerequisites

Install the following before running the project:

- Node.js 18+ and npm
- Java JDK 17+
- Maven 3.9+
- Python 3.10+ (the project was also checked with Python 3.13)
- MySQL 8+

## 1. Database setup

Create the database and import the supplied SQL file.

```sql
CREATE DATABASE IF NOT EXISTS paddy_ai_db;
```

Then import `paddy_ai_db.sql` using phpMyAdmin/MySQL Workbench or the MySQL command line.

The backend also uses `spring.jpa.hibernate.ddl-auto=update`, so new entity fields can be added automatically during development.

## 2. Environment configuration

Sensitive values are not stored as live credentials in source code. Set environment variables before starting Spring Boot.

### Windows PowerShell example

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/paddy_ai_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
$env:DB_USERNAME="paddyuser"
$env:DB_PASSWORD="YOUR_DB_PASSWORD"
$env:JWT_SECRET="CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"
$env:MAIL_USERNAME="YOUR_GMAIL_ADDRESS"
$env:MAIL_PASSWORD="YOUR_GMAIL_APP_PASSWORD"
$env:FRONTEND_BASE_URL="http://localhost:5173"
$env:ML_API_BASE_URL="http://127.0.0.1:8000"
```

If a Gmail App Password was ever committed or shared previously, revoke it and create a new one before using email reset in a real environment.

## 3. Start the ML service

Open a terminal in `ml-module`:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

FastAPI documentation is available at:

```text
http://127.0.0.1:8000/docs
```

## 4. Start the Spring Boot backend

Open a second terminal:

```bash
cd backend
mvn clean spring-boot:run
```

Default backend URL:

```text
http://localhost:8080
```

## 5. Start the React frontend

Open a third terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

For a clean machine, always run `npm install` instead of copying an existing `node_modules` folder from another operating system.

## Correct startup order

1. MySQL
2. Python FastAPI ML service (`8000`)
3. Spring Boot backend (`8080`)
4. React frontend (`5173`)

If the ML service is stopped, AI pages display a visible ML-server warning instead of silently failing.

## Alert and validation behaviour

The final UI uses React Hot Toast for user-facing success/error notifications. Prediction pages show success or failure messages, profile/farm/admin actions show confirmation or errors, notification actions report failures, and expired sessions return the user to login with a session-expired message.

### Disease upload / TC10

The Disease Detection page accepts only:

- JPG / JPEG
- PNG
- WebP
- maximum size: 5 MB

The browser file control intentionally allows the tester to choose an unsupported file so TC10 can be executed. Frontend validation rejects the file immediately. The backend and FastAPI layers also independently reject invalid types.

Expected invalid-file message:

```text
Only JPG, JPEG, PNG or WebP image files are accepted.
```

A direct invalid multipart request returns HTTP `400`.

## TC22 — 403 access-control evidence

TC22 verifies that a FARMER cannot call an administrator-only endpoint.

1. Log in using a normal **FARMER** account.
2. Press `F12` and open **Developer Tools → Console**.
3. Run:

```javascript
fetch('http://localhost:8080/api/admin/stats', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('paddy_token')}`
  }
}).then(async response => {
  console.log('STATUS:', response.status)
  console.log('BODY:', await response.text())
})
```

Expected evidence:

```text
STATUS: 403
{"error":"Forbidden: ADMIN role required."}
```

For the clearest report screenshot, use **Developer Tools → Network**, run the request above, click the `/api/admin/stats` request, and capture the **Status 403** and **Response**. Do not include the Authorization/JWT value in the screenshot; avoid the Headers section or redact the token.

## Mobile responsiveness

The responsive layout was hardened for tablet/mobile widths. At `900px` and below the sidebar changes to an overlay drawer; at phone widths grids collapse to one column and form controls/buttons resize safely. The notification popover is rendered through a React portal into `document.body`, preventing it from being clipped by the transformed mobile sidebar.

Recommended tests in Chrome/Edge DevTools:

- 375 × 812
- 390 × 844
- 768 × 1024
- desktop 1366px+

Check Dashboard, Disease Detection, notifications, History, Profile, My Farms and Admin Panel for horizontal overflow.

## Multilingual interface

Use the EN / Sinhala / Tamil buttons in the sidebar or dashboard. The selected language is stored in `localStorage` and the HTML `lang` attribute is updated automatically.

The final translation pass covers navigation, authentication, Dashboard, prediction-page labels, Farm Management, History, Profile, Admin Panel, notification controls, validation messages and common result-card labels. Model-generated agronomic advice is returned by the ML/backend service and may remain in the model's source language unless a translated response is explicitly provided by that service.

## Favicon

The frontend includes:

```text
frontend/public/favicon.svg
frontend/public/favicon-32.png
frontend/public/favicon-192.png
```

`frontend/index.html` already contains the required favicon and Apple touch-icon links.

## Useful manual regression checks

- User A uploads a profile image → logout → User B login: User A image must not appear.
- Delete a farm/activity with related rows: no foreign-key/server error.
- Stop FastAPI and submit a prediction: ML server alert should appear.
- Use an invalid disease file: validation alert and HTTP 400 protection should work.
- Login with wrong password: error toast should display.
- Use an expired reset link: expired/invalid reset message should display.
- Switch EN → Sinhala → Tamil on every main page.
- Resize to 375px and open the sidebar + notification panel.
- FARMER call to `/api/admin/stats`: HTTP 403.

## Security notes

- BCrypt is used for passwords.
- JWT protects authenticated API endpoints.
- `/api/admin/**` requires the ADMIN role.
- Profile data is resolved from the authenticated account rather than a browser-wide shared profile key.
- Email credentials are supplied through environment variables.
- Never publish `.env` files, database passwords, Gmail App Passwords or JWT secrets.

## Final validation performed on this package

- React/JavaScript source: syntax parsed successfully across all 44 JS/JSX source files.
- Translation-key audit: all static `t(...)` keys used by the frontend are present for English, Sinhala and Tamil.
- Python ML source: `compileall` completed successfully.
- Disease invalid-file API test: unsupported `text/plain` upload returned HTTP 400 with the expected image-format error.

Because the uploaded project contained Windows-oriented `node_modules` and this container does not include Maven, a complete production Vite build and Spring Boot Maven compilation could not be performed in this environment. Run `npm install && npm run build` and `mvn clean test` on the target Windows development machine before submission.

---

© 2026 Paddy AI — Sri Lanka. Designed & Developed by Mohamed Fawaas.
