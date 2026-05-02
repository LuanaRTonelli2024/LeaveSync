# LeaveSync🗓️
A full-stack web application for managing employee time off requests, including vacation days and sick leave. Built with Node.js, Express, MongoDB, Angular, and Socket.io.
🔗 Live Demo: https://leavesyncfrontend.onrender.com

## Features

Employee Dashboard — View vacation and sick leave balances, submit time off requests, and track request status
Admin Dashboard — View a team calendar with all approved time off, manage pending requests (approve/deny), and configure leave policies
Time Off Request — Interactive calendar with date range selection, weekend blocking, and balance validation
Leave Policy Management — Admin can configure vacation days by years of service and set sick leave days
Real-Time Updates — WebSocket integration for live request status updates across all connected clients
Authentication — JWT-based authentication with role-based access control (employee / admin)

## Tech Stack
### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JSON Web Tokens (JWT)
- Bcrypt
- Socket.io

### Frontend
- Angular 
- TypeScript
- SCSS
- Socket.io Client

## Getting Started
### Prerequisites
- Node.js v18+
- npm
- Angular CLI (`npm install -g @angular/cli`)
- MongoDB Atlas account

### Backend Setup

1. Navigate to the backend folder:

cd backend

2. Install dependencies:

npm install

3. Create a `.env` file in the `backend` folder with the following variables:

- MONGO_URI=your_mongodb_connection_string
- JWT_SECRET=your_jwt_secret_key
- PORT=5000

4. Start the server:

node src/server.js

The backend will run on `http://localhost:5000`

### Start the server:
node server.js
The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend folder:

cd LeaveSyncFrontend

2. Install dependencies:

npm install

3. Update the environment file at `src/environments/environment.ts`:

export const environment = {
  apiUrl: 'http://localhost:5000'
};

4. Start the development server:

ng serve

The frontend will run on `http://localhost:4200`


## Environment Variables
### Backend — .env
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `PORT` | Port for the backend server (default: `5000` for development, `10000` for Render) |

### Frontend — environment.ts
| Variable | Description |
|---|---|
| `apiUrl` | Base URL of the backend API |

## Deployment
The application is deployed on Render.

## Backend
| Field | Value |
|---|---|
| Type | Web Service |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node src/server.js` |
| URL | https://leavesyncbackend-iblr.onrender.com |

## Frontend
| Field | Value |
|---|---|
| Type | Static Site |
| Root Directory | `LeaveSyncFrontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist/LeaveSyncFrontend/browser` |
| URL | https://leavesyncfrontend.onrender.com |



## API Endpoints
## Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT token |
| GET | `/auth/me` | Get current user info |

### Time Off Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/requests` | Get all requests (admin only) |
| GET | `/requests/me` | Get current user's requests |
| POST | `/requests` | Create a new request |
| PATCH | `/requests/:id` | Update a request |
| DELETE | `/requests/:id` | Delete a request |
| PATCH | `/requests/:id/approve` | Approve a request (admin only) |
| PATCH | `/requests/:id/deny` | Deny a request (admin only) |


### Leave Policies
| Method | Endpoint | Description |
|---|---|---|
| GET | `/policies` | Get all leave policies |
| GET | `/policies/my-balance` | Get current user's leave balance for the current year |
| GET | `/policies/:id` | Get a specific policy |
| POST | `/policies` | Create a new policy (admin only) |
| PATCH | `/policies/:id` | Update a policy (admin only) |
| DELETE | `/policies/:id` | Delete a policy (admin only) |

### WebSocket Events
| Event | Description |
|-------|-------------|
| `request:created` | Emitted when a new time off request is submitted |
| `request:updated` | Emitted when a request is approved, denied, or edited |
| `request:deleted` | Emitted when a request is cancelled |


## Authors
Jimena Marin — Frontend Development
Luana Tonelli — Backend Development

## Course
Trends in Web Development — Winter 2026
