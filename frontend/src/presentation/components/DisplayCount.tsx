import { useCountStore } from '../../store';

export default function DisplayCount() {
    const count = useCountStore((state) => state.count);

    return (
        <div className="card">
            <p>another component</p>
            <p>The current count is: {count}</p>
        </div>
    );
}
