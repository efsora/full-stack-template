import Counter from '#components/hello/Counter';
import DisplayCount from '#components/hello/DisplayCount';
import CreateUserForm from '#components/user/CreateUserForm';
import SummaryUser from '#components/user/SummaryUser';

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
