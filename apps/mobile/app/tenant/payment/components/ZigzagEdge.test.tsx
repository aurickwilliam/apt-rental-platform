import { fireEvent, render, screen } from "@testing-library/react-native";

import ZigzagEdge from "./ZigzagEdge";

jest.mock("react-native-svg", () => {
  const { View } = jest.requireActual("react-native");
  return { __esModule: true, default: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>, Path: ({ d, fill }: { d: string; fill: string }) => <View testID="path" accessibilityLabel={`${fill}|${d}`} /> };
});

const placementOf = () => {
  const layoutNodes = screen.UNSAFE_root.findAll((node) => typeof node.props.onLayout === "function" && node.props.pointerEvents === "none");
  return layoutNodes[layoutNodes.length - 1].props.style;
};

const draw = (props: Partial<React.ComponentProps<typeof ZigzagEdge>>) => {
  const view = render(<ZigzagEdge cutColor="#FFFFFF" depth={10} toothWidth={20} {...props} />);
  fireEvent(view.UNSAFE_root.findAll((node) => typeof node.props.onLayout === "function")[0], "layout", { nativeEvent: { layout: { width: 100, height: 10 } } });
  return screen.getByTestId("path").props.accessibilityLabel as string;
};

describe("ZigzagEdge", () => {
  it("cuts notches into the card by default, starting in a valley at the corner", () => {
    const [fill, path] = draw({ cutColor: "#376BF5" }).split("|");
    expect(fill).toBe("#376BF5");
    expect(path.startsWith("M0,10 L0,0 L10,10 L20,0")).toBe(true);
  });

  it("leaves whole teeth at both ends of the card instead of half teeth stuck to the corners", () => {
    const path = draw({}).split("|")[1];
    expect(path.endsWith("L90,10 L100,0 L100,10 Z")).toBe(true);
    // five card teeth across 100px: their tips are at the middle of each 20px segment
    const tips = [...path.matchAll(/L(\d+),10 /g)].map((match) => Number(match[1])).slice(0, -1);
    expect(tips).toEqual([10, 30, 50, 70, 90]);
  });

  it("hangs paper-colored teeth below the card when asked: the path starts at the top and points down", () => {
    const [fill, path] = draw({ hanging: true }).split("|");
    expect(fill).toBe("#FFFFFF");
    expect(path.startsWith("M0,0 L10,10 L20,0")).toBe(true);
  });

  it("overlays the bottom of the card for notches, but sits in the flow below it for hanging teeth", () => {
    draw({});
    expect(placementOf()).toMatchObject({ position: "absolute", bottom: 0, left: 0, right: 0, height: 10 });
    screen.unmount();
    draw({ hanging: true });
    expect(placementOf()).toEqual({ height: 10 });
  });

  it("fits whole teeth to the width, five across 100px at a 20px target", () => {
    const path = draw({ hanging: true }).split("|")[1];
    expect(path.match(/L\d+,10/g)).toHaveLength(5);
  });
});
