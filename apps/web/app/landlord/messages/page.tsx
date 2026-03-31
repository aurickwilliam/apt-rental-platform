import MessagesClient from "./components/MessageClient";
import { Contact } from "./components/types";

const currentTenants: Contact[] = [
  { id: "t1", name: "Alice Johnson", avatar: "https://i.pravatar.cc/150?u=t1", apartment: "Sunset Villa - Apt 4B" },
  { id: "t2", name: "Bob Smith", avatar: "https://i.pravatar.cc/150?u=t2", apartment: "Oceanview Condos - 12A" },
  { id: "t3", name: "Elena Rodriguez", avatar: "https://i.pravatar.cc/150?u=t3", apartment: "Sunset Villa - Apt 2C" },
];

const inquiries: Contact[] = [
  { id: "i1", name: "Charlie Davis", avatar: "https://i.pravatar.cc/150?u=i1", apartment: "Inquiring: Maple Street House" },
  { id: "i2", name: "Diana Prince", avatar: "https://i.pravatar.cc/150?u=i2", apartment: "Inquiring: Oceanview Condos - 5B" },
];

export default function MessagesPage() {
  return (
    <MessagesClient
      currentTenants={currentTenants}
      inquiries={inquiries}
    />
  );
}