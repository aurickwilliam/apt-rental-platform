import { processColor } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { findAllInTree } from '../../tests/support/testTraversal';

import GuidedFrameOverlay, { computeGuidedFrameRect } from './GuidedFrameOverlay';

describe('GuidedFrameOverlay rendering', () => {
  it('renders a rectangular mask layout matching computeGuidedFrameRect for a fixed viewport size', async () => {
    const viewportWidth = 390;
    const viewportHeight = 700;
    const expectedFrame = computeGuidedFrameRect(viewportWidth, viewportHeight);

    await render(
      <GuidedFrameOverlay viewportWidth={viewportWidth} viewportHeight={viewportHeight} />,
    );

    // 4 dimmed mask bands (top/bottom/left/right) — the top band's height
    // is the computed frame's y offset, matching computeGuidedFrameRect's
    // geometry, not a re-derivation of it.
    const maskBands = findAllInTree(screen.root!, (node) => String(node.type) === 'View').filter(
      (node) => {
        const style = node.props.style;
        return style && typeof style === 'object' && 'height' in style && style.height === expectedFrame.y;
      },
    );

    expect(maskBands.length).toBeGreaterThan(0);
    expect(findAllInTree(screen.root!, (node) => String(node.type) === 'RNSVGCircle')).toHaveLength(0);
  });

  it('renders a circular guide with the provided success border color', async () => {
    await render(
      <GuidedFrameOverlay
        viewportWidth={390}
        viewportHeight={700}
        aspectRatio={1}
        shape="circle"
        strokeColor="#22C55E"
      />,
    );

    const guides = findAllInTree(screen.root!, (node) => String(node.type) === 'RNSVGCircle');
    const guide = guides.find((node) => node.props.stroke !== undefined);

    // Host props carry the native-processed colour, not the CSS string.
    expect(guide?.props.stroke.payload).toBe(processColor('#22C55E'));
    expect(guide?.props.r).toBeGreaterThan(0);
  });

  it('renders nothing for a non-positive viewport', async () => {
    const { toJSON } = await render(<GuidedFrameOverlay viewportWidth={0} viewportHeight={0} />);
    expect(toJSON()).toBeNull();
  });
});
