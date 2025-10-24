import { create } from 'zustand';

interface CountState {
    count: number;
    increment: (by: number) => void;
    decrement: (by: number) => void;
}

export const useCountStore = create<CountState>((set) => ({
    count: 0,
    increment: (by) => set((state) => ({ count: state.count + by })),
    decrement: (by) => set((state) => ({ count: state.count - by })),
}));
