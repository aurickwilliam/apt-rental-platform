import { fireEvent, screen } from "@testing-library/react-native";

export async function measureRegistrationPolicy(contentHeight = 1200, viewportHeight = 400) {
  // v13's screen.UNSAFE_getByType(ScrollView) was removed in v14; the scroll view
  // is the only host element titled "<policy> document" in the open dialog.
  const scroll = screen.getByLabelText(/ document$/);
  await fireEvent(scroll, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: viewportHeight } } });
  await fireEvent(scroll, "contentSizeChange", 300, contentHeight);
  await fireEvent(screen.getByTestId("registration-policy-end"), "layout", {
    nativeEvent: { layout: { x: 0, y: contentHeight - 17, width: 300, height: 1 } },
  });
  return scroll;
}

export async function finishRegistrationPolicyReading() {
  const scroll = await measureRegistrationPolicy();
  await fireEvent.scroll(scroll, {
    nativeEvent: {
      contentOffset: { x: 0, y: 800 },
      contentSize: { width: 300, height: 1200 },
      layoutMeasurement: { width: 300, height: 400 },
    },
  });
}

export async function readAndCloseRegistrationPolicy(label: "Privacy Policy" | "Terms and Conditions") {
  await fireEvent.press(screen.getByRole("button", { name: `Read ${label}` }));
  await finishRegistrationPolicyReading();
  await fireEvent.press(screen.getByRole("button", { name: `Close ${label}` }));
}
