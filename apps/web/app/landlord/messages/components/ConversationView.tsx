// ConversationView.tsx — Server Component
import { Avatar, ScrollShadow } from "@heroui/react";
import MessageInput from "./MessageInput";
import { Contact } from "./types";

interface ConversationViewProps {
  activeContact: Contact | null;
}

export default function ConversationView({ activeContact }: ConversationViewProps) {
  if (!activeContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
          <span className="text-2xl">💬</span>
        </div>
        <p>Select a conversation from the sidebar to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-4 bg-white shadow-sm z-10">
        <Avatar src={activeContact.avatar} alt={activeContact.name} size="lg" />
        <div>
          <h2 className="text-lg font-bold text-gray-800 leading-tight">{activeContact.name}</h2>
          <p className="text-sm text-gray-500 font-medium">{activeContact.apartment}</p>
        </div>
      </div>

      {/* Chat History */}
      <ScrollShadow className="flex-1 p-4 bg-slate-50">
        <div className="flex flex-col gap-4">
          <div className="self-start bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] border border-gray-100">
            <p className="text-sm text-gray-700">
              Hi, I had a question about the upcoming maintenance schedule.
            </p>
            <span className="text-[10px] text-gray-400 mt-1 block">10:42 AM</span>
          </div>
          <div className="self-end bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]">
            <p className="text-sm">
              Hello! The maintenance team will be on-site this Thursday between 9 AM and 1 PM.
            </p>
            <span className="text-[10px] text-blue-100 mt-1 block">10:45 AM</span>
          </div>
        </div>
      </ScrollShadow>

      <MessageInput />
    </div>
  );
}