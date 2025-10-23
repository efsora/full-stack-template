import { Route, Routes } from 'react-router-dom';
import Layout from '../layout/Layout.tsx';
import Home from '../../pages/Home.tsx';

export default function Router() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
            </Route>
        </Routes>
    );
}
