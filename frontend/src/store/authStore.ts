import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { isTokenExpired } from '../utils/jwt';

/**
 * Auth user data from JWT token or API response
 */
export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Auth store state and actions
 */
export interface AuthState {
    // State
    user: AuthUser | null;
    token: string | null;

    // Actions
    setAuth: (user: AuthUser, token: string) => void;
    setUser: (user: AuthUser) => void;
    setToken: (token: string) => void;
    clearAuth: () => void;

    // Computed
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    getIsAuthenticated: () => boolean;
}

/**
 * Zustand auth store with persistence
 * Stores user data and JWT token in localStorage
 */
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,

            setAuth: (user: AuthUser, token: string) => {
                set({
                    user,
                    token,
                });
            },

            setUser: (user: AuthUser) => {
                set({ user });
            },

            setToken: (token: string) => {
                set({ token });
            },

            clearAuth: () => {
                set({
                    user: null,
                    token: null,
                });
            },

            setIsLoading: (isLoading: boolean) => {
                set({ isLoading });
            },

            /**
             * Get authentication status by validating token expiration
             * Returns true only if token exists and is not expired
             */
            getIsAuthenticated: () => {
                const { token } = get();
                return !isTokenExpired(token);
            },
        }),
        {
            name: 'auth-store', // Key in localStorage
            partialize: (state) => ({
                user: state.user,
                token: state.token,
            }), // Only persist these fields
        },
    ),
);

/**
 * Convenience hook to check if user is authenticated
 * Validates token expiration dynamically
 */
export const useIsAuthenticated = () => {
    const getIsAuthenticated = useAuthStore(
        (state) => state.getIsAuthenticated,
    );
    return getIsAuthenticated();
};

/**
 * Convenience hook to get current user
 */
export const useCurrentUser = () => {
    const { user } = useAuthStore();
    return user;
};

/**
 * Convenience hook to get auth token
 */
export const useAuthToken = () => {
    const { token } = useAuthStore();
    return token;
};
