// app/layout.js  (server component)
import "./globals.css";

export const metadata = {
  title: "Atlas",
  description: "Atlas — Write. Publish. Be found.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('atlas-theme');
                if (saved === 'light' || saved === 'dark') {
                  document.documentElement.setAttribute('data-theme', saved);
                } else {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch (e) {
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            `,
          }}
        />
      </head>
      <body style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        margin: 0,
        padding: 0
      }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
