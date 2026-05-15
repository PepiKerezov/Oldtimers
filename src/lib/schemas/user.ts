import { z } from "zod";

export const createAdminSchema = z.object({
  name: z.string().min(2, "Поне 2 знака").max(80),
  email: z.string().email("Невалиден имейл"),
  password: z.string().min(8, "Минимум 8 знака").max(128),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
