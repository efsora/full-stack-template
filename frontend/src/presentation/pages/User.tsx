import { useParams } from 'react-router-dom';

import DetailedUser from '#components/user/DetailedUser';

export default function User() {
    const { id } = useParams();
    return (
        <>{id ? <DetailedUser id={id} /> : <p>Error: User ID is missing.</p>}</>
    );
}
