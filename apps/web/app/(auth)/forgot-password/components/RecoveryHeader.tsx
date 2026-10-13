interface RecoveryHeaderProps {
  title: string;
  description: React.ReactNode;
  // Back control (a link or a button); its owner decides what leaving means.
  back?: React.ReactNode;
}

export default function RecoveryHeader({ title, description, back }: RecoveryHeaderProps) {
  return (
    <>
      {back && <div className="flex items-center justify-between">{back}</div>}

      <div className="mt-[clamp(0.75rem,2vh,1.25rem)]">
        <h1 className="font-nunito font-semibold text-[clamp(1.75rem,5vw,2.5rem)] leading-tight text-foreground">
          {title}
        </h1>
        <p className="mt-[clamp(0.5rem,1.5vh,0.75rem)] text-base text-foreground">
          {description}
        </p>
      </div>
    </>
  );
}
