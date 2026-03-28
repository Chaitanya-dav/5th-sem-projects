import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import Home from './Components/Home.jsx';
import Login from './Components/Login.jsx';
import Dashboard from './Components/Dashboard.jsx';
import Employees from './Components/Employee.jsx';
import Attendance from './Components/Attendance.jsx';
import Leaves from './Components/Leaves.jsx';
import Performance from './Components/Performance.jsx';
import Assets from './Components/Assets.jsx';
import Salary from './Components/Salary.jsx';
import ProtectedRoute from './Components/ProtectedRoute.jsx';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Home />,
      errorElement: <ErrorBoundary />,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/employees',
      element: (
        <ProtectedRoute>
          <Employees />
        </ProtectedRoute>
      ),
    },
    {
      path: '/attendance',
      element: (
        <ProtectedRoute>
          <Attendance />
        </ProtectedRoute>
      ),
    },
    {
      path: '/leaves',
      element: (
        <ProtectedRoute>
          <Leaves />
        </ProtectedRoute>
      ),
    },
    {
      path: '/performance',
      element: (
        <ProtectedRoute>
          <Performance />
        </ProtectedRoute>
      ),
    },
    {
      path: '/assets',
      element: (
        <ProtectedRoute>
          <Assets />
        </ProtectedRoute>
      ),
    },
    {
      path: '/salary',
      element: (
        <ProtectedRoute>
          <Salary />
        </ProtectedRoute>
      ),
    },
  ]);

  return <RouterProvider router={router} />;
}

function ErrorBoundary() {
  return (
    <div className="error-boundary">
      <div className="error-content">
        <h1>Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <button onClick={() => (window.location.href = '/')} className="btn-primary">
          Go Back Home
        </button>
      </div>
    </div>
  );
}

export default App;
