# ScaleSense AI

ScaleSense AI is a comprehensive waste management system for tracking and managing waste collection, customer information, and user access.

## Features

- User authentication system
- Weight record management
- Customer management
- User management
- Image upload for weight records
- Filtering and searching capabilities

## Technology Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express
- **Database**: SQLite (using better-sqlite3)
- **Authentication**: JSON Web Tokens (JWT)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
```
npm install
```

### Running the Application

1. Start both frontend and backend together:
```
npm run dev:full
```

Or run them separately:

2. Start the frontend:
```
npm run dev
```

3. Start the backend in a separate terminal:
```
npm run server
```

4. Access the application at `http://localhost:5173`

### Default Login Credentials

- Username: `admin`
- Password: `admin123`

## Project Structure

- `/server`: Backend Express server
  - `/config`: Database configuration
  - `/routes`: API routes
  - `/middleware`: Custom middleware
  - `/data`: SQLite database storage
  - `/uploads`: Image uploads storage
- `/src`: Frontend React application
  - `/components`: Reusable UI components
  - `/contexts`: React context providers
  - `/pages`: Application pages
  - `/services`: API service functions

## API Endpoints

### Authentication
- `POST /api/auth/login`: User login

### Users
- `GET /api/users`: Get all users
- `GET /api/users/:id`: Get a specific user
- `POST /api/users`: Create a new user
- `PUT /api/users/:id`: Update a user
- `DELETE /api/users/:id`: Delete a user

### Customers
- `GET /api/customers`: Get all customers
- `GET /api/customers/:id`: Get a specific customer
- `POST /api/customers`: Create a new customer
- `PUT /api/customers/:id`: Update a customer
- `DELETE /api/customers/:id`: Delete a customer

### Weight Records
- `GET /api/weights`: Get all weight records
- `GET /api/weights/:id`: Get a specific weight record
- `GET /api/weights/customer/:customerId`: Get weight records for a specific customer
- `POST /api/weights`: Create a new weight record
- `PUT /api/weights/:id`: Update a weight record
- `DELETE /api/weights/:id`: Delete a weight record

### File Upload
- `POST /api/upload`: Upload an image file
