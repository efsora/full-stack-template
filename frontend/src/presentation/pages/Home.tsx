import Counter from '#components/Counter.tsx';
import CreateUserForm from '#components/CreateUserForm.tsx';
import DisplayCount from '#components/DisplayCount.tsx';
import SummaryUser from '#components/SummaryUser.tsx';

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
