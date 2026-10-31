import { IconChevronLeft, IconPhone, IconUser, IconBuilding, IconShieldCheck, IconRosetteDiscountCheckFilled, IconPlus, IconMoodSmile } from "@tabler/icons-react";
import { DEMO_MESSAGES, DEMO_RENTAL as rental } from "./demo-data";
import { DemoAvatar, DemoStatusBar, DemoSystemNavigation } from "./DemoChrome";
import styles from "./mobile-demo.module.css";

export default function DemoConversation() {
  return (
    <div className={styles.app} data-demo-screen="conversation">
      <header className={styles.chatHeader}>
        <DemoStatusBar />
        <span className={styles.chatBack} data-demo-tap="back"><IconChevronLeft size={24} aria-hidden="true" /></span>
        <DemoAvatar initials={rental.initials} size="small" />
        <div className={styles.chatName}><h2>{rental.landlord}</h2><p>{rental.name}</p></div>
        <IconPhone size={24} aria-hidden="true" />
      </header>
      <div className={`${styles.scroll} ${styles.chatScroll}`} tabIndex={0} aria-label="Fictional conversation history">
        <div className={styles.chatHistory}>
        <div className={styles.chatIntro}>
          <DemoAvatar initials={rental.initials} size="intro" />
          <h3>{rental.landlord}<IconRosetteDiscountCheckFilled size={20} aria-label="Verified account" /></h3>
          <p>{rental.name}</p>
          <div className={styles.introActions}><span><IconUser size={16} aria-hidden="true" />View profile</span><span><IconBuilding size={16} aria-hidden="true" />View apartment</span></div>
          <div className={styles.safety}><IconShieldCheck size={14} aria-hidden="true" /><span>Keep payments inside APT, never through chat.</span></div>
        </div>
        <p className={styles.daySeparator}>Oct 20, 2026</p>
        <div className={styles.bubbles}>
          {DEMO_MESSAGES.map((message, index) => {
            const above = DEMO_MESSAGES[index - 1]?.sent === message.sent;
            const below = DEMO_MESSAGES[index + 1]?.sent === message.sent;
            return (
              <div key={message.id} className={`${styles.bubbleRow} ${message.sent ? styles.sentRow : styles.receivedRow} ${below ? styles.groupedRow : ""}`}>
                {!message.sent && <div className={styles.senderGutter}>{!below && <DemoAvatar initials={rental.initials} size="small" />}</div>}
                <div className={`${styles.bubble} ${message.sent ? styles.sentBubble : styles.receivedBubble}`} data-joins-above={above} data-joins-below={below}>
                  {message.text}
                </div>
              </div>
            );
          })}
          <div className={styles.seen} aria-label={`Seen by ${rental.landlord}`}><DemoAvatar initials={rental.initials} size="small" /></div>
        </div>
        </div>
      </div>
      <div className={styles.composer} aria-label="Message composer — visual only">
        <span className={styles.addAttachment}><IconPlus size={24} aria-hidden="true" /></span>
        <div className={styles.messageField}><IconMoodSmile size={22} aria-hidden="true" /><span>Type a message...</span></div>
      </div>
      <DemoSystemNavigation />
    </div>
  );
}
