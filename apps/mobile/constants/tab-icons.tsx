import {
  Home,
  Search,
  Bed,
  MessageCircle,
  User,
  ChartColumnBig,
  Building2
} from "lucide-react-native";
import { JSX } from "react";

export const TENANTICONS: Record<string, (props: any) => JSX.Element> = {
  home: (props: any) => <Home size={26} strokeWidth={1.5} {...props}/>,
  search: (props: any) => <Search size={26} strokeWidth={1.5} {...props}/>,
  rentals: (props: any) => <Bed size={26} strokeWidth={1.5} {...props}/>,
  chat: (props: any) => <MessageCircle size={26} strokeWidth={1.5} {...props}/>,
  profile: (props: any) => <User size={26} strokeWidth={1.5} {...props}/>,
}

export const LANDLORDICONS: Record<string, (props: any) => JSX.Element> = {
  dashboard: (props: any) => <ChartColumnBig size={26} strokeWidth={1.5} {...props}/>,
  units: (props: any) => <Building2 size={26} strokeWidth={1.5} {...props}/>,
  chat: (props: any) => <MessageCircle size={26} strokeWidth={1.5} {...props}/>,
  profile: (props: any) => <User size={26} strokeWidth={1.5} {...props}/>,
}
