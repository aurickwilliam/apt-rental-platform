import Image from "next/image";

interface ProductShowcaseProps {
  number: string;
  label: string;
  title: string;
  paragraphs: readonly string[];
  reversed?: boolean;
}

export default function ProductShowcase({ number, label, title, paragraphs, reversed = false }: ProductShowcaseProps) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className={reversed ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-2 lg:row-start-1"}>
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
          {number} · {label}
        </p>
        <h3 className="mt-6 font-nunito text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h3>
        <div className="mt-6 space-y-7 text-base leading-7 text-foreground/75">
          {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </div>
      <div className={`relative aspect-[10/9] overflow-hidden rounded-2xl bg-muted/40 ${reversed ? "lg:col-start-2 lg:row-start-1" : "lg:col-start-1 lg:row-start-1"}`}>
        {/* The same approved exports serve both rows; only their composition changes. */}
        <Image
          src="/landing/showcase-discover-web.png"
          alt="APT web apartment search with verified listings and monthly prices"
          width={1023}
          height={768}
          sizes="(min-width: 1024px) 260px, (min-width: 640px) 460px, 60vw"
          className={`absolute w-[60%] rounded-md ${reversed ? "bottom-[10%] right-[7%]" : "left-[7%] top-[8%]"}`}
        />
        <Image
          src="/landing/showcase-discover-phone.png"
          alt="APT mobile rental overview with rent, landlord messages, and maintenance requests"
          width={429}
          height={882}
          sizes="(min-width: 1024px) 112px, (min-width: 640px) 208px, 27vw"
          className={`absolute w-[27%] ${reversed ? "left-[12%] top-[10%]" : "bottom-[7%] right-[14%]"}`}
        />
      </div>
    </div>
  );
}
