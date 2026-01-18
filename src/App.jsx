import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Gastos from "./pages/Gastos";
import { AuthProvider, useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  if (loading) {
    return <div className="card">Carregando sessão...</div>;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/gastos"
      element={
        <ProtectedRoute>
          <Gastos />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/gastos" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
