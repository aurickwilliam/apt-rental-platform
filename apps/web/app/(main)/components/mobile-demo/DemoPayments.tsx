import { IconFilter2 } from "@tabler/icons-react";
import { DEMO_PAYMENTS, DEMO_RENTAL } from "./demo-data";
import { DemoHeader, DemoStatusChip, DemoSystemNavigation } from "./DemoChrome";
import styles from "./mobile-demo.module.css";

export default function DemoPayments() {
  return (
    <div className={styles.app} data-demo-screen="payments">
      <DemoHeader title="Payment History" right={<IconFilter2 size={22} aria-hidden="true" />} />
      <div className={`${styles.scroll} ${styles.paymentsScroll}`} tabIndex={0} aria-label="Payment history records">
        {["2026", "2025"].map((year) => (
          <section key={year}>
            <div className={styles.yearHeader}><h3 className={year === "2026" ? styles.thisYear : styles.pastYear}>{year === "2026" ? "This Year" : year}</h3></div>
            <div className={styles.paymentList}>
              {DEMO_PAYMENTS.filter((payment) => payment.year === year).map((payment) => (
                <article className={`${styles.card} ${styles.paymentCard}`} key={payment.id}>
                  <div className={styles.between}><h4>{payment.month}</h4><span className={styles.paymentAmount}>{payment.amount}</span></div>
                  <div className={styles.paymentDetails}>
                    <p>{DEMO_RENTAL.name}</p>
                    <div className={styles.between}><p>via {payment.method}</p><DemoStatusChip status={payment.status} /></div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <DemoSystemNavigation />
    </div>
  );
}
