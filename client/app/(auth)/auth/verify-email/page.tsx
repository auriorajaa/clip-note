import { Suspense } from "react";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <section className="flex items-center relative">
          <div className="py-10 md:py-20 max-w-lg px-4 sm:px-0 mx-auto w-full">
            <div className="text-center">Verifying your email...</div>
          </div>
        </section>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
