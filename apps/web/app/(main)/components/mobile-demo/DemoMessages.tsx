import { IconArchive, IconSearch, IconPinFilled } from "@tabler/icons-react";
import { DEMO_CONVERSATIONS } from "./demo-data";
import { DemoAvatar, DemoStatusBar, DemoTabBar, DemoSystemNavigation } from "./DemoChrome";
import styles from "./mobile-demo.module.css";

export default function DemoMessages() {
  return (
    <div className={styles.app} data-demo-screen="messages">
      <DemoStatusBar />
      <div className={`${styles.scroll} ${styles.messagesScroll}`} tabIndex={0} aria-label="Messages list">
        <header className={styles.messagesHeader}>
          <div className={styles.between}><h2>Messages</h2><span className={styles.archive}><IconArchive size={26} aria-hidden="true" /></span></div>
          <div className={styles.searchField}><IconSearch size={20} aria-hidden="true" /><span>Search messages...</span></div>
        </header>
        <div className={styles.conversationList}>
          {DEMO_CONVERSATIONS.map((conversation, index) => (
            <div key={conversation.id}>
              {index === 1 && <div className={styles.listSeparator} />}
              <article className={styles.conversationRow} data-demo-tap={conversation.pinned ? "landlord" : undefined}>
                <div className={styles.conversationAvatar}><DemoAvatar initials={conversation.initials} size="large" />
                  {conversation.unread > 0 && <span className={styles.unread}>{conversation.unread}</span>}
                </div>
                <div className={styles.conversationDetails}>
                  <div className={styles.conversationName}>
                    <h3 className={conversation.unread ? styles.unreadName : undefined}>{conversation.name}</h3>
                    {conversation.pinned && <IconPinFilled size={14} aria-label="Pinned" />}
                    <time>{conversation.timestamp}</time>
                  </div>
                  <p className={styles.threadProperty}>{conversation.apartment}</p>
                  <p className={`${styles.threadPreview} ${conversation.unread ? styles.unreadPreview : ""}`}>{conversation.sent ? "You: " : ""}{conversation.preview}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
      <DemoTabBar active="messages" />
      <DemoSystemNavigation />
    </div>
  );
}
