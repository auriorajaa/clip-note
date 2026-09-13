import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Clip Note — Turn YouTube videos into transcripts & insights",
    template: "%s · Clip Note",
  },
  description:
    "Paste a YouTube link and let Clip Note transcribe the audio and analyze the content with AI — summaries, key points, and tags in minutes.",
  keywords: [
    "youtube transcription",
    "video transcript",
    "ai video summary",
    "video analysis",
  ],
  openGraph: {
    title: "Clip Note — Turn YouTube videos into transcripts & insights",
    description:
      "Paste a YouTube link and let Clip Note transcribe the audio and analyze the content with AI.",
    siteName: "Clip Note",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clip Note — Turn YouTube videos into transcripts & insights",
    description:
      "Paste a YouTube link and let Clip Note transcribe the audio and analyze the content with AI.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
        manrope.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Toaster richColors />
      </body>
    </html>
  );
}
