import { useState } from "react";
import { createRoot } from "react-dom/client";
import SettingsModal from "../../app/components/settings/SettingsModal";
import { state, useFixtureRevision } from "./fixture-transports";

function App() {
  useFixtureRevision();
  const [open, setOpen] = useState(false);
  return <main className="p-6">
    <button onClick={() => setOpen(true)}>Open settings</button>
    <output id="persisted">{JSON.stringify(state.persisted)}</output>
    <output id="refreshes">{state.refreshes}</output>
    <SettingsModal open={open} onClose={() => setOpen(false)} activePortal="tenant" initialRoles={["tenant"]} onChangePassword={() => {}} onChangeEmail={() => {}} />
  </main>;
}
createRoot(document.getElementById("root")).render(<App />);
