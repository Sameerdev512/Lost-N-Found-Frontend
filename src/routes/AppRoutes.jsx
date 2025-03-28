import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../components/auth/Login";
import Register from "../components/auth/Register";
import PrivateRoute from "./PrivateRoute";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/admin/AdminDashboard";
import Navigation from "../components/Navigation";
import { AuthProvider } from "../context/AuthContext";

function AppRouter() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          {/* Public Routes */}
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />

          {/* Protected Routes */}
          <Route
            path='/dashboard'
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path='/admin/dashboard'
            element={
              <PrivateRoute adminOnly={true}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* Default Route */}
          <Route path='/' element={<Navigate to='/login' replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default AppRouter;
