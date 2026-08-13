import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { Circle } from 'react-native-svg';

import GuidedFrameOverlay, { computeGuidedFrameRect } from './GuidedFrameOverlay';

describe('GuidedFrameOverlay rendering', () => {
  it('renders a rectangular mask layout matching computeGuidedFrameRect for a fixed viewport size', () => {
    const viewportWidth = 390;
    const viewportHeight = 700;
    const expectedFrame = computeGuidedFrameRect(viewportWidth, viewportHeight);

    const { UNSAFE_getAllByType, UNSAFE_queryByType } = render(
      <GuidedFrameOverlay viewportWidth={viewportWidth} viewportHeight={viewportHeight} />,
    );

    // 4 dimmed mask bands (top/bottom/left/right) — the top band's height
    // is the computed frame's y offset, matching computeGuidedFrameRect's
    // geometry, not a re-derivation of it.
    const maskBands = UNSAFE_getAllByType(View).filter(
      (node) => {
        const style = node.props.style;
        return style && typeof style === 'object' && 'height' in style && style.height === expectedFrame.y;
      },
    );

    expect(maskBands.length).toBeGreaterThan(0);
    expect(UNSAFE_queryByType(Circle)).toBeNull();
  });

  it('renders a circular guide with the provided success border color', () => {
    const { UNSAFE_getAllByType } = render(
      <GuidedFrameOverlay
        viewportWidth={390}
        viewportHeight={700}
        aspectRatio={1}
        shape="circle"
        strokeColor="#22C55E"
      />,
    );

    const guides = UNSAFE_getAllByType(Circle);
    const guide = guides.find((node) => node.props.stroke !== undefined);

    expect(guide?.props.stroke).toBe('#22C55E');
    expect(guide?.props.r).toBeGreaterThan(0);
  });

  it('renders nothing for a non-positive viewport', () => {
    const { toJSON } = render(<GuidedFrameOverlay viewportWidth={0} viewportHeight={0} />);
    expect(toJSON()).toBeNull();
  });
});
