import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/layouts/MarketingLayout";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/payment/success")({
  head: () => ({ meta: [{ title: "Payment successful — UniCare" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-gradient text-white shadow-glow"
        >
          <CheckCircle2 className="h-10 w-10" />
        </motion.div>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Appointment <span className="font-display italic text-brand-gradient">confirmed.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          A calendar invite and receipt are on their way to your inbox. You can reschedule anytime
          from your dashboard.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/patient"
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Go to dashboard
          </Link>
          <Link
            to="/"
            className="rounded-full border border-border bg-white px-6 py-3 text-sm font-medium"
          >
            Back to home
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
