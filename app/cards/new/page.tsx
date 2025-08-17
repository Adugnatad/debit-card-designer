import CardDesigner from "@/components/design";
import { Button } from "@/components/ui/button";
import { DesignSnapshot, STORAGE_KEY } from "@/lib/types";

export default function Page() {
  const handleCheckout = () => {
    // Handle checkout logic here
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DesignSnapshot;
        // applySnapshot(parsed);
        // setLastSavedAt(Date.now());
        // toast({ title: "Restored saved design" });
      }
    } catch (e) {
      console.warn("No valid saved design to restore");
    }
  };

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
          <Button
            // href="/cards/checkout"
            onClick={handleCheckout}
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Checkout
          </Button>
        </header>
        <CardDesigner />
      </div>
    </main>
  );
}
