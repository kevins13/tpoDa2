import { z } from 'zod';
import validator from 'validator';

const strictEmail = z
  .string()
  .email('Email inválido')
  .refine((email) => validator.isEmail(email, { allow_utf8_local_part: false }), {
    message: 'Email inválido',
  });

export const registerSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: strictEmail,
  numeroPais: z.coerce.number().int().positive('El país es requerido'),
  address: z.string().min(5, 'La dirección es requerida'),
  documento: z.string().regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos numéricos'),
});

export const completeRegistrationSchema = z.object({
  email: z.string().email('Email inválido'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
export const forgotPasswordSchema = z.object({
  email: strictEmail,
});
