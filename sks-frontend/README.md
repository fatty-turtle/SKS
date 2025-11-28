# SKS Frontend

A modern React-based frontend application for the SKS (Student Knowledge System) platform, built with Vite for fast development and optimized builds. This application provides user authentication features including login and registration, integrated with a backend API.

## Features

- **User Authentication**: Secure login and registration with email verification.
- **Responsive Design**: Built with Bootstrap for mobile-friendly UI components.
- **Routing**: Client-side routing using React Router DOM for seamless navigation.
- **API Integration**: Axios-based HTTP client for communicating with the backend API.
- **Form Validation**: Client-side validation for user inputs with error handling.
- **Token Management**: JWT token storage in localStorage for session management.

## Tech Stack

- **Frontend Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Styling**: Bootstrap 5.3.8, React Bootstrap 2.10.10
- **Routing**: React Router DOM 7.9.4
- **HTTP Client**: Axios 1.12.2
- **Linting**: ESLint 9.36.0 with React-specific rules
- **Development**: Hot Module Replacement (HMR) enabled

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sks-frontend-master
   ```

2. Install dependencies:
   ```bash
   npm install ---force
   npm install jwt-decode ---force
   npm install react-icons ---force
   npm install mammoth react-doc-viewer react-file-viewer --force 
   npm install react-router-dom ---force
   npm install mermaid ---force
   npm install mermaid @mermaid-js/mermaid-mindmap ---force
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173` (default Vite port).

## Available Scripts

- `npm run dev` - Start the development server with HMR
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks


