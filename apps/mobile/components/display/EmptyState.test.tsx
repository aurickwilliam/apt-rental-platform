import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

import EmptyState from "./EmptyState";

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { primary: "#376BF5" } }),
}));

function TestIcon({ size, color }: { size?: number; color?: string }) {
  return <Text>{`icon ${size} ${color}`}</Text>;
}

describe("EmptyState", () => {
  it("renders the icon at the shared size and brand color, with title and description", async () => {
    await render(
      <EmptyState
        icon={TestIcon as never}
        title="No items yet"
        description="Items will appear here."
      />,
    );

    expect(screen.getByText("icon 32 #376BF5")).toBeTruthy();
    expect(screen.getByText("No items yet")).toBeTruthy();
    expect(screen.getByText("Items will appear here.")).toBeTruthy();
  });

  it("omits the description and action when not given", async () => {
    await render(<EmptyState icon={TestIcon as never} title="Nothing here" />);

    expect(screen.getByText("Nothing here")).toBeTruthy();
    expect(screen.queryByText("Items will appear here.")).toBeNull();
  });

  it("renders the optional action", async () => {
    await render(
      <EmptyState
        icon={TestIcon as never}
        title="No items yet"
        action={<Text>Add item</Text>}
      />,
    );

    expect(screen.getByText("Add item")).toBeTruthy();
  });

  it("uses the default vertical padding unless the caller sets its own", async () => {
    const rootClass = async (className?: string) => {
      await await render(<EmptyState icon={TestIcon as never} title="x" className={className} />);
      const root = screen.toJSON() as unknown as { props: { className: string } };
      return root.props.className;
    };

    expect(await rootClass()).toContain("py-10");
    expect(await rootClass("py-4")).not.toContain("py-10");
    expect(await rootClass("pt-16 pb-0")).not.toContain("py-10");
    expect(await rootClass("flex-1")).toContain("py-10");
  });

  it("lets a caller override the icon color", async () => {
    await render(<EmptyState icon={TestIcon as never} title="Paid" iconColor="#22C55E" />);

    expect(screen.getByText("icon 32 #22C55E")).toBeTruthy();
  });
});
