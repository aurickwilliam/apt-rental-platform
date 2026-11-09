import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { Button } from "@heroui/react";
import SettingsModal from "../../app/components/settings/SettingsModal";

function Fixture() {
  const [open, setOpen] = useState(false);
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Button onPress={() => setOpen(true)}>Open settings</Button>
      <SettingsModal
        open={open}
        onClose={() => setOpen(false)}
        initialRoles={["tenant"]}
        activePortal="tenant"
        requestedRental={new URLSearchParams(location.search).has("rental")}
        onChangePassword={() => {}}
        onChangeEmail={() => {}}
      />
    </ThemeProvider>
  );
}
createRoot(document.getElementById("root")).render(<Fixture />);
