import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SubscriptionCancelPage() {
  return (
    <div className="mx-auto">
      <Card className="p-8 text-center space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Checkout canceled</h1>
          <p className="text-sm text-muted-foreground">
            No worries — your card wasn&apos;t charged. You can pick a plan
            whenever you&apos;re ready.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link href="/subscriptions" className="flex-1">
            <Button className="w-full">Back to Plans</Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
