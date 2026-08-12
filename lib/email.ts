import nodemailer from "nodemailer";
import { getEnv } from "./env";

export async function sendCode(to: string, code: string, purpose: "verify"|"login") {
  const env = getEnv();
  const transporter = nodemailer.createTransport({ host:env.SMTP_HOST, port:env.SMTP_PORT, secure:env.SMTP_PORT===465, auth:{ user:env.SMTP_USER, pass:env.SMTP_PASS } });
  const subject = purpose === "verify" ? "Подтвердите почту в мотисквад" : "Код входа в мотисквад";
  await transporter.sendMail({ from:`мотисквад <${env.SMTP_FROM}>`, to, subject, text:`Ваш одноразовый код: ${code}. Он действует 10 минут. Если это были не вы, просто проигнорируйте письмо.`, html:`<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h1 style="font-weight:500">мотисквад</h1><p>${subject}</p><div style="font-size:36px;letter-spacing:8px;background:#D6F238;padding:22px">${code}</div><p>Код действует 10 минут. Никому его не сообщайте.</p></div>` });
}
