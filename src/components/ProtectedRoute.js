// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, children }) => {
    if (!user) {
        // Se o utilizador não estiver autenticado, redireciona para a página de login
        return <Navigate to="/" />;
    }
    return children; // Se o utilizador estiver autenticado, renderiza os filhos
};

export default ProtectedRoute;