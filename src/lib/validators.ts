import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^998[0-9]{9}$/, 'Telefon raqam noto\'g\'ri formatda');

export const otpSchema = z
  .string()
  .length(4, 'Kod 4 ta raqamdan iborat bo\'lishi kerak')
  .regex(/^[0-9]+$/, 'Faqat raqamlar');

export const loginSchema = z.object({
  phoneNumber: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phoneNumber: phoneSchema,
  code: otpSchema,
});
