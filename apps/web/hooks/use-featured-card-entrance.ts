"use client";

import { useEffect, useRef } from "react";
import { animate, inView, type AnimationPlaybackControls } from "motion/react";
import type { CarouselApi } from "@/components/ui/carousel";
import { useLandingReducedMotion } from "@/hooks/use-landing-motion";
import { LANDING_EASE } from "@/app/(main)/components/landing-motion";

/** Animate only the initially visible card contents, never Embla's rail or slide geometry. */
export function useFeaturedCardEntrance(api: CarouselApi) {
  const reduced = useLandingReducedMotion();
  const revealed = useRef(false);

  useEffect(() => {
    if (!api) return;
    const cards = api.slideNodes().map(slide => slide.querySelector<HTMLElement>("[data-featured-card]"));
    const show = (card: HTMLElement | null) => {
      if (!card) return;
      card.style.opacity = "1";
      card.style.transform = "none";
    };
    if (reduced || revealed.current) {
      revealed.current = true;
      cards.forEach(show);
      return;
    }

    const animations: AnimationPlaybackControls[] = [];
    const settle = () => {
      animations.forEach(animation => animation.complete());
      cards.forEach(show);
    };
    const finish = () => { revealed.current = true; settle(); };
    const stopWatching = inView(api.rootNode(), () => {
      if (revealed.current) return;
      revealed.current = true;
      const visible = api.slidesInView();
      cards.forEach((card, index) => { if (!visible.includes(index)) show(card); });
      visible.forEach((slideIndex, order) => {
        const card = cards[slideIndex];
        if (!card) return;
        // CSS already supplies the SSR first frame. Never reset painted content
        // with [0, 1] keyframes when hydration/Embla becomes ready later.
        animations.push(animate(card, { opacity: 1, y: 0 }, {
          duration: 1.65, delay: order * 0.195, ease: LANDING_EASE,
        }));
      });
    }, { amount: 0.15 });

    // A visitor who interacts during the reveal gets fully visible cards immediately.
    api.on("pointerDown", finish);
    api.on("slideFocus", finish);
    api.on("select", finish);
    api.on("reInit", finish);
    return () => {
      stopWatching();
      settle();
      api.off("pointerDown", finish);
      api.off("slideFocus", finish);
      api.off("select", finish);
      api.off("reInit", finish);
    };
  }, [api, reduced]);
}
