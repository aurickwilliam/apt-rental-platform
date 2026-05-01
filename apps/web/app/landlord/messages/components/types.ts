export type TabKey = "current" | "inquiries";

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  apartment: string;
  unreadCount: number;
}
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  apartment_id: string | null;
  created_at: string;
  updated_at: string;
}