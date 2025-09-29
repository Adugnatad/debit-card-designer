import Link from "next/link";
import CheckoutForm from "@/components/checkout-form";
import CardPreview from "@/components/card-preview";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Checkout
          </h1>
          <Button asChild variant="outline">
            <Link href="/">Back to Designer</Link>
          </Button>
        </div>

        {/* Make right column wide enough to fit the 420px card without squeezing */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_520px]">
          {/* Left: payment form */}
          <div className="space-y-6">
            <CheckoutForm />
          </div>

          {/* Right: preview and summary */}
          <div className="space-y-6 md:sticky md:top-4 md:self-start md:max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <CardPreview />
          </div>
        </div>
      </div>
    </main>
  );
}
