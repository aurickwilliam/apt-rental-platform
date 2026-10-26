import { IconArrowUpRight } from "@tabler/icons-react";

import LandingCta from "./LandingCta";

export default function StartBrowsingBtn() {
  return (
    <LandingCta href="/browse">
      Explore apartments <IconArrowUpRight size={16} aria-hidden="true" />
    </LandingCta>
  );
}
