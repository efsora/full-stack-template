import { Route, Routes } from 'react-router-dom';
import Layout from '../layout/Layout/Layout.tsx';
import Home from '../../pages/Home.tsx';
import User from '../../pages/User.tsx';

export default function Router() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="/users/:id" element={<User />} />
            </Route>
        </Routes>
    );
}
