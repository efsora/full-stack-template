import { useCountStore } from '#store/index';

export default function Counter() {
    const count = useCountStore((state) => state.count);
    const increment = useCountStore((state) => state.increment);
    const decrement = useCountStore((state) => state.decrement);

    return (
        <div className="card">
            <p>counter: {count}</p>
            <button onClick={() => decrement(1)}>Decrement</button>
            <button onClick={() => increment(1)}>Increment</button>
        </div>
    );
}
