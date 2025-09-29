import CheckoutButton from "@/components/checkout-button";
import CardDesigner from "@/components/design";

export default function Page() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Back to home
          </a>
          <div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Custom Card Designer
            </h1>
            <p className="text-sm text-muted-foreground hidden md:block">
              Customize a virtual debit/credit card with text, logos, and
              backgrounds.
            </p>
          </div>
          <CheckoutButton />
        </header>
        <CardDesigner />
      </div>
    </main>
  );
}
