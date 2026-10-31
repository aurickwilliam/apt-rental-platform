import {
  IconArrowRight,
  IconBrandFacebook,
  IconHelpCircle,
  IconMapPin,
} from "@tabler/icons-react";

import LandingReveal from "./LandingReveal";
import design from "./landing-design.module.css";

const OFFICE_ADDRESS = "109 Samson Road corner Caimito Road, Caloocan, Philippines";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61583486606822";

export default function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-title" className={`scroll-mt-24 ${design.contact}`}>
      <div className={design.contactPanel}>
        <LandingReveal name="contact-heading" duration={0.7} className={design.centeredIntro}>
          <p className={`uppercase text-secondary-foreground ${design.eyebrow}`}>Contact us</p>
          <h2 id="contact-title" className={`mt-4 font-nunito text-foreground ${design.sectionTitle}`}>
            Let&apos;s talk about renting.
          </h2>
          <p className="mt-3 text-lg leading-8 text-foreground/75">
            Questions about renting or listing a property? Reach the APT team through the channels below.
          </p>
        </LandingReveal>

        <div className={design.contactCards}>
          <LandingReveal name="contact-office" delay={0.04} duration={0.6} className="h-full">
            <article className={design.contactCard}>
              <span className={design.contactIcon}>
                <IconMapPin size={22} stroke={1.75} aria-hidden="true" />
              </span>
              <h3 className={design.contactTitle}>Office</h3>
              <p className={design.contactText}>{OFFICE_ADDRESS}</p>
            </article>
          </LandingReveal>

          <LandingReveal name="contact-facebook" delay={0.1} duration={0.6} className="h-full">
            <article className={design.contactCard}>
              <span className={design.contactIcon}>
                <IconBrandFacebook size={22} stroke={1.75} aria-hidden="true" />
              </span>
              <h3 className={design.contactTitle}>Facebook</h3>
              <p className={design.contactText}>Message the official APT page for questions and updates.</p>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`${design.contactAction} inline-flex items-center gap-1 hover:underline`}
              >
                Open Facebook
                <IconArrowRight size={14} stroke={2} aria-hidden="true" />
              </a>
            </article>
          </LandingReveal>

          <LandingReveal name="contact-faqs" delay={0.16} duration={0.6} className="h-full">
            <article className={design.contactCard}>
              <span className={design.contactIcon}>
                <IconHelpCircle size={22} stroke={1.75} aria-hidden="true" />
              </span>
              <h3 className={design.contactTitle}>Quick answers</h3>
              <p className={design.contactText}>
                Find help with rent, maintenance, leases, and your account in the FAQs above.
              </p>
              <a href="#faqs" className={`${design.contactAction} inline-flex items-center gap-1 hover:underline`}>
                Read the FAQs
                <IconArrowRight size={14} stroke={2} aria-hidden="true" />
              </a>
            </article>
          </LandingReveal>
        </div>
      </div>
    </section>
  );
}
