import Image from "next/image";

interface ProductShowcaseProps {
  number: string;
  label: string;
  title: string;
  paragraphs: readonly string[];
  image: { src: string; alt: string };
  reversed?: boolean;
}

export default function ProductShowcase({ number, label, title, paragraphs, image, reversed = false }: ProductShowcaseProps) {
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
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1280px) 584px, (min-width: 1024px) calc(50vw - 80px), calc(100vw - 48px)"
          className="object-cover"
        />
      </div>
    </div>
  );
}
