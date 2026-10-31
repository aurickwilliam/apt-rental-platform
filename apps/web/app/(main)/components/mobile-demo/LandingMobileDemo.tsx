"use client";

import dynamic from "next/dynamic";
import LandingDemoPoster from "./LandingDemoPoster";

// Keep server-rendered Rentals visible while the separate walkthrough chunk loads.
// The approved screens/timeline/controller remain solely in MobileDemo.
const Walkthrough = dynamic(() => import("./MobileDemo"), { loading: LandingDemoPoster });

export default function LandingMobileDemo({ fontClassName }: { fontClassName: string }) {
  return (
    <div className={fontClassName} style={{ display: "contents" }}>
      <Walkthrough presentation="landing" />
    </div>
  );
}
