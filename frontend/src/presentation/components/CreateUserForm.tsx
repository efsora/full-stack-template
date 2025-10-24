import { useTranslation } from 'react-i18next';
import { useCreateUser } from '../../hooks/useCreateUser.ts';
import { useToastMutation } from '../../hooks/useToastQuery.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput } from './common/TextInput.tsx';
import { useForm } from 'react-hook-form';

const userSchema = z.object({
    user_name: z.string().min(1, 'Name is required'),
    user_surname: z.string().min(1, 'Surname is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
type UserFormData = z.infer<typeof userSchema>;

export default function CreateUserForm() {
    const { t } = useTranslation();

    const createUser = useToastMutation(useCreateUser());

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
    });

    const onSubmit = async (data: UserFormData) => {
        const result = await createUser.mutateAsync(data);
        if (result?.success) reset();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="card">
            <p className="font-bold text-xl mb-2">{t('create-user')}</p>
            <TextInput
                id="userName"
                label={t('name')}
                field="user_name"
                errors={errors}
                register={register}
            />
            <TextInput
                id="userSurname"
                label={t('surname')}
                field="user_surname"
                errors={errors}
                register={register}
            />
            <TextInput
                id="userPassword"
                label={t('password')}
                field="password"
                errors={errors}
                register={register}
            />
            <button
                type="submit"
                disabled={isSubmitting || createUser.isPending}
            >
                {isSubmitting || createUser.isPending
                    ? t('loading')
                    : t('submit')}
            </button>
        </form>
    );
}
