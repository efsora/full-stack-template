import {
    type FieldErrors,
    type FieldValues,
    type Path,
    useForm,
} from 'react-hook-form';

interface TextInputProps<T extends FieldValues> {
    id: string;
    label: string;
    field: Path<T>;
    errors: FieldErrors<T>;
    register: ReturnType<typeof useForm<T>>['register'];
}

export function TextInput<T extends FieldValues>({
    id,
    label,
    field,
    errors,
    register,
}: TextInputProps<T>) {
    return (
        <div>
            <label htmlFor={id}>{label}:</label>
            <input id={id} {...register(field)} />
            {errors[field] && (
                <p className="text-red-500 text-sm">
                    {errors[field]?.message as string}
                </p>
            )}
        </div>
    );
}
