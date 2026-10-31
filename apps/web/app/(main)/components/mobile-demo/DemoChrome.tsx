import type { ReactNode } from "react";
import {
  IconBattery4, IconBed, IconBedFilled, IconChevronLeft,
  IconMessageCircle, IconSearch, IconUser, IconWifi, IconAntennaBars5,
  IconClock, IconCircleCheck,
} from "@tabler/icons-react";
import type { DemoStatus } from "./demo-data";
import styles from "./mobile-demo.module.css";

export function DemoStatusBar({ onImage = false }: { onImage?: boolean }) {
  return (
    <div className={`${styles.statusBar} ${onImage ? styles.statusOnImage : ""}`} data-demo-os-chrome aria-hidden="true">
      <span>9:41</span>
      <div><IconAntennaBars5 size={16} /><IconWifi size={16} /><IconBattery4 size={19} /></div>
    </div>
  );
}

export function DemoSystemNavigation() {
  return <div className={styles.systemNavigation} data-demo-os-chrome aria-hidden="true"><span /></div>;
}

export function DemoTabBar({ active }: { active: "rentals" | "messages" }) {
  const tabs = [
    { id: "rentals", label: "Rentals", icon: active === "rentals" ? IconBedFilled : IconBed },
    { id: "search", label: "Search", icon: IconSearch },
    { id: "messages", label: "Chat", icon: IconMessageCircle },
    { id: "profile", label: "Profile", icon: IconUser },
  ];
  return (
    <div className={styles.tabBar} data-demo-tab-bar>
      {tabs.map(({ id, label, icon: Icon }) => (
        <div key={id} data-demo-tap={id} className={active === id ? styles.tabActive : styles.tab}>
          <Icon size={24} stroke={active === id ? 2.5 : 1.8} aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function DemoHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header className={styles.standardHeader}>
      <DemoStatusBar />
      <span className={styles.headerSide} data-demo-tap="back"><IconChevronLeft size={24} aria-hidden="true" /></span>
      <h2>{title}</h2>
      <span className={styles.headerSide}>{right}</span>
    </header>
  );
}

export function DemoAvatar({ initials, size = "medium" }: { initials: string; size?: "small" | "medium" | "large" | "intro" }) {
  return <span className={`${styles.avatar} ${styles[`avatar_${size}`]}`} aria-hidden="true">{initials}</span>;
}

export function DemoStatusChip({ status, icon = false }: { status: DemoStatus; icon?: boolean }) {
  const success = status === "Paid" || status === "Resolved";
  const Icon = success ? IconCircleCheck : IconClock;
  return (
    <span className={`${styles.chip} ${success ? styles.chipSuccess : styles.chipWarning}`}>
      {icon && <Icon size={14} aria-hidden="true" />}{status}
    </span>
  );
}
