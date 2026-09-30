"use client";

interface SectionTitleProps {
  title: string;
}

export default function SectionTitle({ title }: SectionTitleProps) {
  return (
    <h2 className="font-nunito font-semibold text-base text-foreground">
      {title}
    </h2>
  );
}