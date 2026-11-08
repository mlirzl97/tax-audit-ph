import "./globals.css";

export const metadata = {
  title: "Tax Audit PH",
  description: "A calm first-response workspace for Philippine tax notices.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
