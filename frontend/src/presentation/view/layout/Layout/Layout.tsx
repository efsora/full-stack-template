import { Outlet } from 'react-router-dom';
import styles from './Layout.module.css';
import LeftBar from '../LeftBar.tsx';
import Header from '../Header.tsx';
import Footer from '../Footer.tsx';
import RightBar from '../RightBar.tsx';

export default function Layout() {
    return (
        <div className={styles.container}>
            <LeftBar />
            <div className={styles.content}>
                <Header />
                <div className={styles.outlet}>
                    <Outlet />
                </div>
                <Footer />
            </div>
            <RightBar />
        </div>
    );
}
