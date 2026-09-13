import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Youtube } from "@/components/icons/Youtube";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PricingPreview } from "@/components/landing/pricing-preview";

const features = [
  {
    label: "Transcription",
    title: "Accurate, readable transcripts",
    description:
      "Automatically transcribe any YouTube video into clean text powered by speech recognition.",
  },
  {
    label: "Analysis",
    title: "AI-generated summaries",
    description:
      "Get instant summaries, key points, sentiment, and suggested tags, understand a video without watching the whole thing.",
  },
  {
    label: "Speed",
    title: "Minutes, not hours",
    description:
      "Paste a URL and let Clip Note handle the rest. Track progress in real-time from your dashboard.",
  },
];

const steps = [
  {
    number: "01",
    title: "Paste a YouTube URL",
    description: "Drop in the link to any video you want to understand faster.",
  },
  {
    number: "02",
    title: "We process it",
    description:
      "Clip Note downloads, transcribes, and analyzes the content automatically.",
  },
  {
    number: "03",
    title: "Get your insights",
    description:
      "Read the summary, key points, and full transcript in your dashboard.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Clip Note Logo"
              width={28}
              height={28}
            />
            <span className="text-lg font-bold">Clip Note</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Turn YouTube videos into{" "}
            <span className="text-primary">transcripts & insights</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Paste a link, and Clip Note transcribes the audio and analyzes the
            content with AI (summaries, key points, and tags in minutes)
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register">
              <Button size="lg" className="gap-1.5 w-full sm:w-auto">
                Get Started Free
                <ArrowRightIcon className="size-4" />
              </Button>
            </Link>
            <Link href="/subscriptions">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Pricing
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            No credit card required · 3 free videos to start
          </p>
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  "space-y-3",
                  index !== 0 && "sm:border-l sm:pl-8 border-border/60",
                )}
              >
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {feature.label}
                </span>
                <h3 className="text-lg font-semibold leading-snug">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white dark:bg-zinc-950 border-y py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
              How it works
            </h2>

            <div className="grid gap-8 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="text-center space-y-2">
                  <div className="mx-auto w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                    {step.number}
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground">
              Start free. Upgrade when you need more.
            </p>
          </div>

          <PricingPreview />
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="rounded-3xl bg-primary text-primary-foreground p-10 sm:p-14 space-y-4">
            <Youtube className="size-10 mx-auto opacity-90" />
            <h2 className="text-2xl sm:text-3xl font-bold">
              Ready to save time on videos?
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto">
              Join Clip Note and start transcribing your first video in minutes
              — completely free.
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="gap-1.5 mt-2">
                Create Free Account
                <ArrowRightIcon className="size-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Clip Note Logo"
              width={20}
              height={20}
            />
            <span>
              © {new Date().getFullYear()} Clip Note. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms-of-service" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy-policy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
