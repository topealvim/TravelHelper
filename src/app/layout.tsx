import type { Metadata } from "next";
import "./globals.css";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";

export const metadata: Metadata = {
  title: "TravelHelper - Family Trip Planner",
  description: "Collaborative trip planning for families, powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <GoogleMapsProvider>{children}</GoogleMapsProvider>
      </body>
    </html>
  );
}
