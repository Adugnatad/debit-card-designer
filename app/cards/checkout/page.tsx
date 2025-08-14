import Link from "next/link";
import CheckoutForm from "@/components/checkout-form";
import CardPreview from "@/components/card-preview";
import { Card, CardContent } from "@/components/ui/card";
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
            {/* <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Virtual Card Design
                  </span>
                  <span className="text-sm font-medium">$9.99</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm">Total</span>
                  <span className="text-base font-semibold">$9.99</span>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </main>
  );
}
