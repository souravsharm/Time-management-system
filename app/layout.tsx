import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Availability & Roster Planner",
  description: "Find common times and build simple roster suggestions."
};

/**
 * Runs before first paint so the saved theme is on the <html> element already —
 * without it the page flashes the wrong background. Dark is the default, so an
 * unset preference stamps dark rather than falling through to the OS setting.
 */
const themeScript = `(function(){try{
var c=localStorage.getItem("availability-roster-planner.theme");
if(c!=="light"&&c!=="dark"&&c!=="system")c="dark";
if(c!=="system")document.documentElement.setAttribute("data-theme",c);
}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
