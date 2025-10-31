import { Route, Routes } from 'react-router-dom';

import Layout from '#layout/Layout/Layout';
import Home from '#pages/Home';
import User from '#pages/User';

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
