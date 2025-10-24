import SummaryUser from '../components/SummaryUser.tsx';
import CreateUserForm from '../components/CreateUserForm.tsx';
import Counter from '../components/Counter.tsx';
import DisplayCount from '../components/DisplayCount.tsx';

export default function Home() {
    return (
        <>
            <SummaryUser />
            <CreateUserForm />
            <Counter />
            <DisplayCount />
        </>
    );
}
