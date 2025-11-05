import { Route, Routes } from 'react-router-dom';

import Layout from '#layout/Layout/Layout';
import Home from '#pages/Home';
import { LoginPage } from '#pages/LoginPage';
import { RegisterPage } from '#pages/RegisterPage';
import User from '#pages/User';
import Users from '#pages/Users';
import { ProtectedRoute } from '#presentation/components/auth/ProtectedRoute';
import { PublicRoute } from '#presentation/components/auth/PublicRoute';

export default function Router() {
    return (
        <Routes>
            {/* Public routes (redirect to home if authenticated) */}
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <RegisterPage />
                    </PublicRoute>
                }
            />

            {/* Protected routes wrapped with Layout */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Home />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/:id" element={<User />} />
            </Route>
        </Routes>
    );
}
