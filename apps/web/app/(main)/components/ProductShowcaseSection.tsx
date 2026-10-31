import ProductShowcase from "./ProductShowcase";
import DiscoverShowcase from "./DiscoverShowcase";
import LiveManageShowcase from "./LiveManageShowcase";
import LandingReveal from "./LandingReveal";
import design from "./landing-design.module.css";

export default function ProductShowcaseSection() {
  return (
    <section aria-labelledby="thriving-title" className={design.products}>
      <LandingReveal name="thriving-heading" duration={1.4} className={design.chapterIntro}>
        <h2 id="thriving-title" className={`font-nunito text-foreground ${design.chapterTitle}`}>
          From finding to thriving.
        </h2>
        <p className={`text-lg leading-8 text-foreground/75 ${design.chapterDescription}`}>
          Discover apartments, apply for your next home, and manage everything in one place with APT.
        </p>
      </LandingReveal>
      <div className={design.productRows}>
        <ProductShowcase
          number="01"
          label="Discover & apply"
          title="Find a place that fits."
          paragraphs={[
            "Explore available apartments, review property details, and submit your rental application in one place.",
          ]}
          media={<DiscoverShowcase />}
        />
        <ProductShowcase
          number="02"
          label="Live & manage"
          title="Stay connected. Stay in control."
          paragraphs={[
            "Keep rental conversations, payment records, and requests organized in one place.",
            "Manage the details of renting with less back-and-forth, from your desktop or mobile device.",
          ]}
          media={<LiveManageShowcase />}
          reversed
        />
      </div>
    </section>
  );
}
