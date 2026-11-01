# THIRD_PARTY.md — Open Source Libraries & Solvers

In accordance with Section 6 of the Hackathon Problem Statement, this document lists all third-party open-source libraries, frameworks, solvers, and runtime tools utilized in Campora.

---

## 1. Optimization Engine (Python Service)

| Library / Tool | Version | License | Purpose |
| :--- | :--- | :--- | :--- |
| **Google OR-Tools (`ortools`)** | `^9.9.0` | Apache-2.0 | Core discrete CP-SAT solver for canonical academic timetabling (H1–H14), midsem exam scheduling (E1–E2), Spectra Week priority matching (B1–B3), and 2-stage stability repair. |
| **FastAPI** | `^0.110.0` | MIT | High-performance asynchronous HTTP microservice exposing solver endpoints to Node.js backend. |
| **Uvicorn** | `^0.28.0` | BSD-3-Clause | ASGI production web server for FastAPI. |
| **Pydantic** | `^2.6.0` | MIT | Strict JSON schema data parsing and validation. |

---

## 2. Backend Gateway & Authority Service (Node.js)

| Library / Tool | Version | License | Purpose |
| :--- | :--- | :--- | :--- |
| **Express.js** | `^4.21.2` | MIT | REST API gateway, role-based access control, workflow orchestration. |
| **Prisma ORM** | `^6.4.0` | Apache-2.0 | Type-safe database client and migrations for MySQL database. |
| **jsonwebtoken** | `^9.0.2` | MIT | JWT token generation and verification for 4 demo stakeholder roles. |
| **bcryptjs** | `^3.0.2` | MIT | Salted password hashing for campus user authentication. |
| **axios** | `^1.7.9` | MIT | HTTP client for communication between Node.js API and Python solver. |
| **cors** | `^2.8.5` | MIT | Cross-Origin Resource Sharing middleware. |
| **dotenv** | `^16.4.7` | BSD-2-Clause | Environment variable management. |
| **tsx** | `^4.19.3` | MIT | TypeScript runtime executor. |

---

## 3. Frontend Web Application (React + Vite)

| Library / Tool | Version | License | Purpose |
| :--- | :--- | :--- | :--- |
| **React 18** | `^18.3.1` | MIT | Core UI library. |
| **Vite** | `^6.0.0` | MIT | Next-generation frontend build tool and dev server. |
| **Tailwind CSS** | `^3.4.17` | MIT | Utility-first CSS framework adhering to institute design guidelines. |
| **shadcn/ui** | Custom / Radix | MIT | Accessible UI primitive components (Sheets, Dialogs, Selects, Tabs, Badges). |
| **Lucide React** | `^0.460.0` | ISC | Vector iconography for operational workflows. |
| **Sonner** | `^1.7.0` | MIT | Toast notification system. |
| **date-fns** | `^4.1.0` | MIT | Date manipulation and formatting. |

---

## 4. Database Infrastructure

- **MySQL Database Server 8.0**: Relational database storage for `cit_campus_os`, managing dataset versions, schedules, assignments, booking requests, decisions, and immutable audit logs.

