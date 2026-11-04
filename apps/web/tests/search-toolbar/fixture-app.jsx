import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@heroui/react";
import { IconAdjustmentsHorizontal, IconSparkles } from "@tabler/icons-react";
import SearchContainer from "../../app/browse/components/SearchContainer";

// Dark mode is a class on <html> in the app; mirror it for the fixture.
if (new URLSearchParams(window.location.search).has("dark")) {
  document.documentElement.classList.add("dark");
}

function record(value) {
  document.getElementById("fixture-actions").textContent = value;
}

// Same shape as FilterDrawerButton's entry (tertiary, lg, icon-only, 44px),
// without its drawer chunk so the layout can be measured in isolation.
function FilterButton() {
  return (
    <Button
      isIconOnly
      variant="tertiary"
      size="lg"
      className="relative shrink-0"
      aria-label="Open filters"
      onPress={() => record("Filter")}
    >
      <IconAdjustmentsHorizontal size={18} />
    </Button>
  );
}

// Same shape as AskAvaButton; its drawer is what loads lazily in production.
function AvaButton() {
  return (
    <Button
      isIconOnly
      variant="tertiary"
      size="lg"
      className="shrink-0 cursor-pointer text-primary"
      aria-label="Ask Ava, the APT Virtual Assistant"
      onPress={() => record("Ava")}
    >
      <IconSparkles size={18} />
    </Button>
  );
}

function Fixture() {
  return (
    <main className="min-h-dvh bg-background p-4 sm:p-6">
      <SearchContainer
        basePath="/tenant/browse"
        filterButton={<FilterButton />}
        mapHref="/tenant/browse/map"
        assistantButton={<AvaButton />}
      />
      <p role="status" id="fixture-actions" className="mt-4 text-sm" />
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
