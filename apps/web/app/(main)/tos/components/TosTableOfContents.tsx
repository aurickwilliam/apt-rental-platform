// apps/web/app/(main)/tos/components/TosTableOfContents.tsx
import { motion } from "framer-motion";
import { TOC } from "../data/tos-sections";
import { fadeUp } from "../data/animations";

type TosTableOfContentsProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export default function TosTableOfContents({ activeId, onNavigate }: TosTableOfContentsProps) {
  return (
    <motion.aside
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="hidden md:block sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto py-10 pr-8"
    >
      <div className="mb-4 text-xs font-poppinsSemiBold uppercase tracking-widest text-default-500">
        Contents
      </div>
      <nav className="flex flex-col">
        {TOC.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`border-l-2 py-1.5 pl-3 text-left text-sm leading-tight transition-colors ${
              activeId === item.id
                ? "border-primary font-poppinsSemiBold text-primary"
                : "border-transparent text-default-500 hover:border-primary/20 hover:text-primary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </motion.aside>
  );
}