import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/layouts/MarketingLayout";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/payment/failed")({
  head: () => ({ meta: [{ title: "Payment failed — UniCare" }] }),
  component: FailedPage,
});

function FailedPage() {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-destructive/10 text-destructive">
          <XCircle className="h-10 w-10" />
        </div>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Payment couldn't be processed.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Nothing was charged. Please try again or use a different payment method.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/doctors"
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Try again
          </Link>
          <Link
            to="/contact"
            className="rounded-full border border-border bg-white px-6 py-3 text-sm font-medium"
          >
            Contact support
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
