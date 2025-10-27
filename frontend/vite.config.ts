import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '#store': path.resolve(__dirname, 'src/store'),
            '#components': path.resolve(
                __dirname,
                'src/presentation/components',
            ),
            '#pages': path.resolve(__dirname, 'src/presentation/pages'),
            '#layout': path.resolve(__dirname, 'src/presentation/view/layout'),
            '#api': path.resolve(__dirname, 'src/api'),
            '#hooks': path.resolve(__dirname, 'src/hooks'),
            '#config': path.resolve(__dirname, 'src/config'),
            '#utils': path.resolve(__dirname, 'src/utils'),
            '#models': path.resolve(__dirname, 'src/api/models'),
        },
    },
});
