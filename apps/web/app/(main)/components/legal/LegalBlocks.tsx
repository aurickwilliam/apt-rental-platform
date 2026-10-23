import LegalBulletList from "./LegalBulletList";

type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: readonly string[] };

interface LegalBlocksProps {
  blocks: readonly LegalBlock[];
}

export default function LegalBlocks({ blocks }: LegalBlocksProps) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return <p key={index}>{block.text}</p>;
        }
        if (block.type === "subheading") {
          return (
            <h3
              key={index}
              className="mt-2 font-nunito text-base font-bold text-foreground first:mt-0"
            >
              {block.text}
            </h3>
          );
        }
        return <LegalBulletList key={index} items={block.items} />;
      })}
    </>
  );
}
