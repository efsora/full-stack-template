import { z } from 'zod';

export const userSchema = z.object({
    user_name: z.string().min(1, 'Name is required'),
    user_surname: z.string().min(1, 'Surname is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type UserFormData = z.infer<typeof userSchema>;
