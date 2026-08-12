import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "мотисквад — команда для первого IT-проекта",
  description: "Сообщество основателей и начинающих специалистов, которые вместе создают IT-проекты.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
