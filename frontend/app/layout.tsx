import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Font files served locally by Next (no external request at runtime);
// exposed as CSS variables consumed by globals.css / dashboard.css.
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
