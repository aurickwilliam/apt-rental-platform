"use client";

import SharedConversationView from "@/app/components/chat/ConversationView";
import type { Contact } from "./types";

type SharedProps = Parameters<typeof SharedConversationView>[0];

/** The landlord thread: the shared conversation view with this portal's contact and links. */
export default function ConversationView(props: Omit<SharedProps, "portal" | "activeContact"> & { activeContact: Contact | null }) {
  return <SharedConversationView portal="landlord" {...props} />;
}
