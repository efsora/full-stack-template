import { notifyInApp } from '../../notify/notifyInApp.ts';

export default function NotifierButton() {
    const handleNotification = () => {
        notifyInApp
            .async(new Promise((res) => setTimeout(() => res('ok'), 1500)), {
                loading: 'Saving...',
                success: 'Saved!',
                error: 'Failed',
            })
            .then(console.log);
    };

    return (
        <div>
            <button onClick={handleNotification}>click to notify</button>
        </div>
    );
}
