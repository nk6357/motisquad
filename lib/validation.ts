import { z } from "zod";

export const email = z.string().trim().toLowerCase().email().max(254);
export const password = z.string().min(12).max(128).regex(/[a-zа-я]/i, "Добавьте букву").regex(/\d/, "Добавьте цифру");
export const role = z.enum(["talent", "founder"]);
export const level = z.enum(["Без опыта", "Есть опыт"]);
export const specialization = z.enum(["Разработка", "Дизайн", "Продукт-менеджмент", "Аналитика", "Продвижение", "Продажи", "Юриспруденция", "Другая роль"]);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80), email, password, role,
}).strict();
export const loginSchema = z.object({ email, password }).strict();
export const verifySchema = z.object({ challengeId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).strict();
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80), role, specialization, level,
  bio: z.string().trim().min(100).max(2000), stack: z.string().trim().max(220).default(""),
  published: z.boolean(),
}).strict();
export const projectSchema = z.object({
  name: z.string().trim().min(2).max(80), category: z.string().trim().min(2).max(80),
  title: z.string().trim().min(3).max(120), description: z.string().trim().min(100).max(2000),
  specialization, level, teamSize: z.number().int().min(1).max(50), published: z.boolean(),
}).strict();
