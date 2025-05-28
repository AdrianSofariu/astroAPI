# AstroAPI

AstroAPI is a backend service built with Node.js, Express, and Supabase. It provides a comprehensive suite of functionalities for managing astronomical data posts, user authentication, image and file handling, activity logging, and user monitoring.

## Features

- **Post Management:**
  - CRUD operations for posts (Create, Read, Update, Delete).
  - Pagination and filtering (search by title, filter by type).
  - Sorting posts by date and ID.
- **Type Management:**
  - List available post types.
- **User Authentication:**
  - User registration and login.
  - JWT-based authentication for secure API access.
  - Endpoint to fetch current user details (`/me`).
  - Logout functionality.
- **Image Handling:**
  - Upload images to Supabase Storage.
  - Serves images publicly via Supabase URLs.
  - (Legacy support for serving images from a local `/images` directory).
- **Logging & Monitoring:**
  - Logs user actions (e.g., creating, updating, deleting posts) to a Supabase `logs` table.
  - Logs client IP addresses to a local `ip-log.txt` file.
  - Background monitoring service (`monitor.js`) to detect suspicious activity based on action frequency and flag users in a `monitored_users` Supabase table.
  - Endpoint to view flagged users.
- **Bulk Operations:**
  - Endpoint to add a large number of sample posts for testing (`/api/addbulk`).
- **Health Check:**
  - `GET /api/health` endpoint to verify server status.
- **CORS Configuration:**
  - Configurable Cross-Origin Resource Sharing to allow requests from specified frontend origins.
- **WebSocket Integration:**
  - Basic setup for WebSocket communication (details in `websocket_generation/generator_utils.js`).

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT (JSON Web Tokens)
- **File Storage:** Supabase Storage (for images), Local file system (for general files)
- **Other Libraries:**
  - `@supabase/supabase-js`: Supabase client library.
  - `jsonwebtoken`: For generating and verifying JWTs.
  - `multer`: For handling `multipart/form-data` (file uploads).
  - `cors`: For enabling CORS.
  - `body-parser`: For parsing request bodies.
  - `cookie-parser`: For parsing cookies.
  - `dotenv`: For managing environment variables.

## Prerequisites

- Node.js (v14.x or later recommended)
- npm or yarn
- A Supabase account and project.

## Environment Variables

Create a `.env` file in the root of your project and add the following environment variables:

```env
# Supabase credentials
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# JWT secret for signing tokens
JWT_SECRET=your_strong_jwt_secret

# Frontend URL for CORS configuration (optional, defaults to http://localhost:3000)
FRONTEND_URL=http://yourfrontenddomain.com

# Port for the API server (optional, defaults to 3001)
PORT=3001



```
