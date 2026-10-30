import Image from "next/image";
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";

import { teamMembers } from "../about/data/AboutData";
import LandingReveal from "./LandingReveal";
import design from "./landing-design.module.css";

export default function TeamSection() {
  return (
    <section id="team" aria-labelledby="team-title" className={`scroll-mt-24 ${design.team}`}>
      <LandingReveal name="team-heading" duration={0.7} className={design.centeredIntro}>
        <p className={`uppercase text-secondary-foreground ${design.eyebrow}`}>Our team</p>
        <h2 id="team-title" className={`mt-4 font-nunito text-foreground ${design.sectionTitle}`}>
          The people behind APT.
        </h2>
        <p className="mt-3 text-lg leading-8 text-foreground/75">
          A student team designing and building a simpler, safer rental experience for the Philippines.
        </p>
      </LandingReveal>

      <ul role="list" className={design.teamGrid}>
        {teamMembers.map((member, index) => (
          <li key={member.name} className="min-w-0">
            <LandingReveal
              name={`team-member-${index + 1}`}
              delay={index * 0.06}
              duration={0.6}
              className="h-full"
            >
              <article className={design.teamCard}>
                <div className={design.teamPortrait}>
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(min-width: 1024px) 108px, 96px"
                    className="object-cover object-top"
                  />
                </div>
                <h3 className={design.teamName}>{member.name}</h3>
                <p className={design.teamRole}>{member.role}</p>

                {member.github || member.linkedin ? (
                  <div className={design.teamLinks}>
                    {member.github ? (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} on GitHub`}
                        className={`${design.teamLink} transition-colors hover:border-primary hover:text-primary`}
                      >
                        <IconBrandGithub size={18} stroke={1.75} aria-hidden="true" />
                      </a>
                    ) : null}
                    {member.linkedin ? (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} on LinkedIn`}
                        className={`${design.teamLink} transition-colors hover:border-primary hover:text-primary`}
                      >
                        <IconBrandLinkedin size={18} stroke={1.75} aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </article>
            </LandingReveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
