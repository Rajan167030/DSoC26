import "./globals.css";
import AuthProvider from "./providers";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

export const metadata = {
  title: "Devnovate Summer of Code 2026 - Developer Hub",
  description: "Devnovate Summer of Code 2026 (DSoC) open-source program and developer hub",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-C6JN2B7DYK"
        ></script>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-C6JN2B7DYK', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased overflow-x-hidden">
        <AuthProvider>
          
            {children}
          
        </AuthProvider>
      </body>
    </html>
  );
}
