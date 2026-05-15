import { z } from "zod";

export const contactInputSchema = z.object({
  name: z.string().min(2, "Поне 2 знака").max(80),
  email: z.string().email("Невалиден имейл"),
  subject: z.string().min(2, "Поне 2 знака").max(120),
  message: z.string().min(10, "Поне 10 знака").max(5000),
  turnstileToken: z.string().min(1, "Моля потвърди, че не си робот"),
});

export type ContactInput = z.infer<typeof contactInputSchema>;
