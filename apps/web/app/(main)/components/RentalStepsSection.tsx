import { Card } from "@heroui/react";

const STEPS = [
  { number: "01", title: "Discover", description: "Browse available apartments and find a place that fits your location, budget, and preferences." },
  { number: "02", title: "Apply", description: "Contact an owner and submit your application with the required details." },
  { number: "03", title: "Settle in", description: "Keep conversations, payment records, and rental requests organized." },
] as const;

export default function RentalStepsSection() {
  return (
    <section aria-labelledby="rental-steps-title" className="py-8 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">The rental journey</p>
      <h2 id="rental-steps-title" className="mt-4 font-nunito text-3xl font-bold tracking-tight text-foreground">
        How renting works on <span className="text-brand">APT.</span>
      </h2>
      <p className="mt-3 text-base leading-7 text-foreground/75">A clear path from browsing apartments to managing your rental.</p>
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {STEPS.map(step => (
          <li key={step.number}>
            <Card variant="secondary" className="h-full rounded-2xl p-6 shadow-none sm:p-7">
              <Card.Content>
                <span aria-hidden="true" className="text-xs font-semibold text-secondary-foreground">{step.number}</span>
                <h3 className="mt-6 font-nunito text-xl font-bold text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-foreground/75">{step.description}</p>
              </Card.Content>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
