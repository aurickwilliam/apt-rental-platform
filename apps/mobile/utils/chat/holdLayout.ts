export interface HoldAnchor {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

export interface HoldViewport {
  screenH: number;
  usableTop: number;
  usableBottom: number;
}

export interface HoldStackSizes {
  /** Reaction pill height; 0 when the message can't be reacted to. */
  reactionsH: number;
  menuH: number;
}

export interface HoldLayout {
  /** Reaction pill top (above the bubble). */
  reactionsTop: number;
  /** Where the held bubble settles. */
  bubbleTop: number;
  /** Actions card top (below the bubble). */
  menuTop: number;
  /** True when the bubble has to move from where it was in the chat. */
  bubbleMoved: boolean;
}

const GAP = 8;

/**
 * Hold-stack positioning (Messenger / WhatsApp / Google Messages style):
 * reaction pill above the bubble, actions card below it, and the whole
 * stack centered vertically in the usable viewport. The bubble glides from
 * its place in the chat to its slot in the stack.
 *
 * A stack taller than the viewport is pinned to the top, and the actions
 * card is kept on screen (it may then overlap the bottom of a very tall
 * bubble, such as a portrait photo).
 */
export function computeHoldLayout(
  anchor: HoldAnchor,
  { reactionsH, menuH }: HoldStackSizes,
  viewport: HoldViewport,
): HoldLayout {
  const { usableTop, usableBottom } = viewport;
  const usableH = usableBottom - usableTop;
  const reactionsBlock = reactionsH > 0 ? reactionsH + GAP : 0;
  const stackH = reactionsBlock + anchor.height + GAP + menuH;

  const stackTop =
    stackH >= usableH ? usableTop : usableTop + (usableH - stackH) / 2;

  const bubbleTop = stackTop + reactionsBlock;
  const menuTop = Math.min(
    bubbleTop + anchor.height + GAP,
    Math.max(usableTop, usableBottom - menuH),
  );

  return {
    reactionsTop: stackTop,
    bubbleTop,
    menuTop,
    bubbleMoved: bubbleTop !== anchor.pageY,
  };
}
