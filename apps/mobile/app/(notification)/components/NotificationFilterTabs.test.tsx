import { fireEvent, render, screen } from "@testing-library/react-native";

import NotificationFilterTabs from "./NotificationFilterTabs";

const onChange = jest.fn();

beforeEach(() => jest.clearAllMocks());

it("marks the active filter as selected", async () => {
  await render(<NotificationFilterTabs value="unread" onChange={onChange} />);

  expect(screen.getByRole("tab", { name: "Unread", selected: true })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "All", selected: false })).toBeTruthy();
});

it("reports the tapped filter", async () => {
  await render(<NotificationFilterTabs value="all" onChange={onChange} />);

  await fireEvent.press(screen.getByRole("tab", { name: "Unread" }));

  expect(onChange).toHaveBeenCalledWith("unread");
});
