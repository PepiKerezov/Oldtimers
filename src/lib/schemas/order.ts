import { z } from "zod";

const currentYear = new Date().getFullYear();

export const phoneRegex = /^(\+359|0)[0-9]{8,9}$/;

export const orderInputSchema = z.object({
  carMake: z.string().min(2, "Поне 2 знака").max(40),
  carModel: z.string().min(1, "Задължително").max(60),
  carYear: z
    .number()
    .int()
    .min(1900, "Невалидна година")
    .max(currentYear, `Не по-късно от ${currentYear}`),
  partDesc: z
    .string()
    .min(10, "Опиши частта поне с 10 знака")
    .max(2000, "Максимум 2000 знака"),
  customerName: z.string().min(2, "Поне 2 знака").max(80),
  email: z.string().email("Невалиден имейл"),
  phone: z
    .string()
    .regex(phoneRegex, "Българско число: +359XXXXXXXXX или 0XXXXXXXXX"),
  notes: z.string().max(1000).optional().or(z.literal("")),
  turnstileToken: z.string().min(1, "Моля потвърди, че не си робот"),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
