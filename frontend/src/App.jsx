import { useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Home from "./Components/Home.jsx";
import Login from "./Components/Login.jsx";
import Dashboard from "./Components/Dashboard.jsx";
import Employees from "./Components/Employee.jsx";
import Attendance from "./Components/Attendance.jsx";
import Leaves from "./Components/Leaves.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
      errorElement: <ErrorBoundary />, // Add this line
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/employees",
      element: (
        <ProtectedRoute>
          <Employees />
        </ProtectedRoute>
      ),
    },
    {
      path: "/attendance",
      element: (
        <ProtectedRoute>
          <Attendance />
       </ProtectedRoute>
      ),
    },
    {
      path: "/leaves",
      element: (
        <ProtectedRoute>
          <Leaves />
         </ProtectedRoute>
      ),
    },
  ]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

// Add Error Boundary Component
function ErrorBoundary() {
  return (
    <div className="error-boundary">
      <div className="error-content">
        <h1>Oops! Something went wrong</h1>
        <p>We're sorry, but the page you're looking for cannot be found.</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="btn-primary"
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
}

export default App;


