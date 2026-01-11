import { Home, Search, Bed, MessageCircle, User } from "lucide-react-native";
import { JSX } from "react";

export const TENANTICONS: Record<string, (props: any) => JSX.Element> = {
    home: (props: any) => <Home size={26} strokeWidth={1.5} {...props}/>,
    search: (props: any) => <Search size={26} strokeWidth={1.5} {...props}/>,
    rentals: (props: any) => <Bed size={26} strokeWidth={1.5} {...props}/>,
    message: (props: any) => <MessageCircle size={26} strokeWidth={1.5} {...props}/>,
    profile: (props: any) => <User size={26} strokeWidth={1.5} {...props}/>,
  }
