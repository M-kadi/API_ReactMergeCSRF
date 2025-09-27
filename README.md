# BFF + JWT + React UI (with CSRF Protection)

This repository contains a complete sample solution demonstrating modern secure web application development with:

- **ASP.NET Core Web API** with **BFF (Backend for Frontend)** pattern
- **CSRF (Cross-Site Request Forgery) protection**
- **JWT Authentication (legacy API for comparison)**
- **React frontend (Vite + React)** consuming the BFF-secured API

---

## 📂 Project Structure

```
BffReactSolutionMergeCSRF/
│── JwtApi/                # Legacy API with JWT Authentication (old style)
│── BffServer (merged)     # ASP.NET Core API using BFF + CSRF
│── ReactUI_BFF/           # React frontend (Vite + React)
│── API_ReactMergeCSRF.sln # Visual Studio Solution file
│── README.md              # This file
│── .gitignore             # Git ignore rules
```

---

## 🔑 Features

### 1. **JwtApi (Legacy API)**
- Classic **JWT Bearer authentication**
- Tokens stored and managed on the client
- Used as a baseline comparison for the BFF approach

### 2. **BffServer API (with CSRF)**
- Implements the **BFF (Backend for Frontend)** pattern
- Handles authentication server-side (cookies instead of tokens in localStorage)
- Protects all state-changing requests with **CSRF tokens**
- Endpoints:
  - `POST /bff/login` – user login
  - `POST /bff/logout` – user logout
  - `GET /bff/csrf` – fetch CSRF token
  - `GET /bff/whoami` – current user info
  - `CRUD /bff/students` – student management
  - `CRUD /bff/teachers` – teacher management

### 3. **ReactUI_BFF (Frontend)**
- Built with **React + Vite**
- Communicates with the API only via the BFF layer
- Fetches **CSRF token** automatically and attaches it to requests
- Handles:
  - Login / Logout
  - Student CRUD operations
  - Teacher CRUD operations

---

## 🚀 Getting Started

### 1. Clone the repository
```sh
git clone https://github.com/your-username/BffReactSolutionMergeCSRF.git
cd BffReactSolutionMergeCSRF
```

### 2. Backend Setup
Open the solution in **Visual Studio 2022**:

```sh
API_ReactMergeCSRF.sln
```

- Set **JwtApi** and **BffServer (merged API)** to start.
- Update `appsettings.json` if needed (connection string, keys, etc.).
- Run the backend:
  - JwtApi runs at: `https://localhost:5001`
  - BffServer runs at: `https://localhost:54451`

### 3. Frontend Setup
Navigate to the React project and install dependencies:

```sh
cd ReactUI_BFF
npm install
npm run dev
```

Frontend will start at:

```
https://localhost:5173
```

---

## 🔐 Security Comparison

| Feature          | JWT Only (JwtApi) | BFF API | BFF + CSRF (current) |
|------------------|-------------------|---------|----------------------|
| Token Storage    | LocalStorage      | HttpOnly Cookies | HttpOnly Cookies |
| XSS Protection   | ❌ Vulnerable     | ✅ Safer | ✅ Safer |
| CSRF Protection  | ❌ None           | ❌ Minimal | ✅ Strong (CSRF token) |
| Popularity       | Still common      | Growing | Modern best practice |
| Recommended?     | ⚠️ For legacy apps | ✅ Yes | ✅✅ Best |

---

## 📌 Notes

- The **legacy JwtApi** is included for **reference & comparison**.  
- The **BFF + CSRF** solution is the **secure and recommended** approach.  
- Frontend uses **fetch with credentials** and attaches **X-CSRF** header for state-changing requests.  

---

## 🤝 Contributing

1. Fork the repo  
2. Create a feature branch (`git checkout -b feature/my-feature`)  
3. Commit changes (`git commit -m 'Add feature'`)  
4. Push branch (`git push origin feature/my-feature`)  
5. Open a Pull Request  

---

## 📜 License

This project is licensed under the MIT License.
