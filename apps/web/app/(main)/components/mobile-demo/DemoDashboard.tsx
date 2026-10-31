"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  IconBell, IconMapPinFilled, IconCreditCard, IconHistory, IconPencil,
  IconReceipt, IconClipboardText, IconTool, IconSettings, IconHelpCircle,
  IconMessageCircle,
} from "@tabler/icons-react";
import { DEMO_RENTAL as rental, DEMO_VIEWPORT, DEMO_HERO_HEIGHT } from "./demo-data";
import { DemoAvatar, DemoStatusBar, DemoStatusChip, DemoTabBar, DemoSystemNavigation } from "./DemoChrome";
import styles from "./mobile-demo.module.css";

const quickActions = [
  { label: "Receipts", icon: IconReceipt },
  { label: "Applications", icon: IconClipboardText },
  { label: "Repairs", icon: IconTool },
  { label: "Settings", icon: IconSettings },
  { label: "FAQ", icon: IconHelpCircle },
];

export default function DemoDashboard() {
  const [pastHero, setPastHero] = useState(false);
  const previousPastHero = useRef(false);

  return (
    <div className={styles.app} data-demo-screen="rentals">
      <div className={pastHero ? styles.rentStatusScrolled : styles.rentStatus}>
        <DemoStatusBar onImage={!pastHero} />
      </div>
      <div className={`${styles.scroll} ${styles.rentalsScroll}`} tabIndex={0} aria-label="Rental dashboard content"
        onScroll={(event) => {
          // Match Rentals' status-bar threshold; update only when crossing it.
          const next = event.currentTarget.scrollTop > DEMO_HERO_HEIGHT - DEMO_VIEWPORT.topInset;
          if (next !== previousPastHero.current) {
            previousPastHero.current = next;
            setPastHero(next);
          }
        }}>
        <div className={styles.rentalHero}>
          <Image src={rental.cover} alt="Illustrative living room in the fictional Maple Studio" fill unoptimized sizes="412px" className={styles.heroImage} />
          <div className={styles.heroScrim} />
          <span className={styles.bell}><IconBell size={26} aria-hidden="true" /></span>
          <div className={styles.heroCopy}>
            <h2>{rental.name}</h2>
            <div className={styles.address}><IconMapPinFilled size={16} aria-hidden="true" /><p>{rental.address}</p></div>
            <span className={styles.descriptionLink}>View Description</span>
          </div>
        </div>
        <div className={styles.dashboardBody}>
          <section className={styles.rentCard} aria-label="Monthly rent summary">
            <div className={styles.between}><h3>Monthly rent</h3><DemoStatusChip status="Pending" icon /></div>
            <div className={styles.rentAmount}>{rental.rent}</div>
            <p className={styles.rentPeriod}>{rental.period} · Due {rental.dueDate}</p>
            <div className={styles.rentActions}>
              <span className={styles.payNow} data-demo-inert="checkout"><IconCreditCard size={16} stroke={2} aria-hidden="true" />Pay Now</span>
              <span className={styles.historyIcon} aria-label="View payment history" data-demo-destination="payments" data-demo-tap="history"><IconHistory size={22} stroke={2} aria-hidden="true" /></span>
            </div>
          </section>
          <section className={styles.quickActions} aria-label="Quick Actions">
            <div className={styles.quickHeading}><h3>Quick Actions</h3><IconPencil size={20} aria-hidden="true" /></div>
            <div className={styles.quickGrid}>
              {quickActions.map(({ label, icon: Icon }) => (
                <div className={styles.quickAction} key={label} data-demo-destination={label === "Receipts" ? "payments" : undefined}>
                  <span><Icon size={20} stroke={2} aria-hidden="true" /></span><p>{label}</p>
                </div>
              ))}
            </div>
          </section>
          <section className={`${styles.card} ${styles.landlordCard}`} aria-label="Your landlord">
            <DemoAvatar initials={rental.initials} />
            <div><h3>{rental.landlord}</h3><p>Landlord</p></div>
            <span className={styles.messageLandlord}><IconMessageCircle size={22} aria-hidden="true" /></span>
          </section>
          <section className={`${styles.card} ${styles.maintenance}`} aria-label="Maintenance">
            <div className={styles.between}><h3>Maintenance</h3><span className={styles.activeCount}>1 Active</span></div>
            <div className={styles.maintenanceRequest}>
              <div className={styles.between}><h4>Kitchen sink leak</h4><DemoStatusChip status="In Progress" /></div>
              <p>Category: Plumbing</p>
              <div className={styles.between}><small>Reported Oct 19, 2026</small><span className={styles.urgency}>Medium Urgency</span></div>
            </div>
            <span className={styles.viewAll}>View all</span>
            <p>You can file a new request once your open one is resolved.</p>
          </section>
        </div>
      </div>
      <DemoTabBar active="rentals" />
      <DemoSystemNavigation />
    </div>
  );
}
