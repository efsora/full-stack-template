import { useNavigate } from 'react-router-dom';

import Counter from '#components/hello/Counter';
import DisplayCount from '#components/hello/DisplayCount';
import SummaryUser from '#components/user/SummaryUser';

export default function Home() {
    const navigate = useNavigate();

    return (
        <>
            <div className="mb-4">
                <button
                    onClick={() => navigate('/users')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                    View All Users
                </button>
            </div>
            <SummaryUser />
            <Counter />
            <DisplayCount />
        </>
    );
}
