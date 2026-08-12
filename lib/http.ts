import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof ZodError) return Response.json({ error:"Проверьте заполнение полей", fields:error.flatten().fieldErrors }, { status:400 });
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "RATE_LIMITED") return Response.json({ error:"Слишком много попыток. Попробуйте позже." }, { status:429 });
  if (message === "INVALID_ORIGIN") return Response.json({ error:"Запрос отклонён" }, { status:403 });
  console.error(error);
  return Response.json({ error:"Временная ошибка сервера" }, { status:500 });
}

export function noStore(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, { ...init, headers:{ "Cache-Control":"no-store", ...(init.headers || {}) } });
}
