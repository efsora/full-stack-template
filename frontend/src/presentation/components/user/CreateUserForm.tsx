import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { userSchema, type UserFormData } from '#api/schemas/user.schemas';
import { useToastMutation } from '#hooks/useToastQuery';
import { useCreateUser } from '#hooks/useUser';

import { TextInput } from '../common/TextInput.tsx';

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
                id="userEmail"
                label={t('email')}
                field="email"
                errors={errors}
                register={register}
            />
            <TextInput
                id="userName"
                label={t('name')}
                field="name"
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
