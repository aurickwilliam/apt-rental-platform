import ProductShowcase from "./ProductShowcase";

export default function ProductShowcaseSection() {
  return (
    <section aria-labelledby="thriving-title" className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 id="thriving-title" className="font-nunito text-3xl font-bold tracking-tight text-foreground">
          From finding to thriving.
        </h2>
        <p className="mt-4 text-lg leading-8 text-foreground/75">
          Discover apartments, apply for your next home, and manage everything in one place with APT.
        </p>
      </div>
      <div className="mt-12 space-y-16 sm:mt-16 lg:space-y-32">
        <ProductShowcase
          number="01"
          label="Discover & apply"
          title="Find a place that fits."
          paragraphs={[
            "Explore available apartments, compare your options, and connect with property owners in one convenient place.",
            "Submit applications and keep important rental documents organized, whether you are on the web or on your phone.",
          ]}
          image={{ src: "/landing/showcase-modern-apartments.jpg", alt: "Modern brick apartment building with glass windows and balconies in warm sunlight" }}
        />
        <ProductShowcase
          number="02"
          label="Live & manage"
          title="Stay connected. Stay in control."
          paragraphs={[
            "Keep rental conversations, payment records, and requests organized in one place.",
            "Manage the details of renting with less back-and-forth, from your desktop or mobile device.",
          ]}
          image={{ src: "/landing/showcase-townhouse-apartments.jpg", alt: "Row of three-storey apartment townhouses with balconies and ground-floor entrances" }}
          reversed
        />
      </div>
    </section>
  );
}
