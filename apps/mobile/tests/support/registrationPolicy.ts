import { fireEvent, screen } from "@testing-library/react-native";
import { ScrollView } from "react-native";

export function measureRegistrationPolicy(contentHeight = 1200, viewportHeight = 400) {
  const scroll = screen.UNSAFE_getByType(ScrollView);
  fireEvent(scroll, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: viewportHeight } } });
  fireEvent(scroll, "contentSizeChange", 300, contentHeight);
  fireEvent(screen.getByTestId("registration-policy-end"), "layout", {
    nativeEvent: { layout: { x: 0, y: contentHeight - 17, width: 300, height: 1 } },
  });
  return scroll;
}

export function finishRegistrationPolicyReading() {
  const scroll = measureRegistrationPolicy();
  fireEvent.scroll(scroll, {
    nativeEvent: {
      contentOffset: { x: 0, y: 800 },
      contentSize: { width: 300, height: 1200 },
      layoutMeasurement: { width: 300, height: 400 },
    },
  });
}

export function readAndCloseRegistrationPolicy(label: "Privacy Policy" | "Terms and Conditions") {
  fireEvent.press(screen.getByRole("button", { name: `Read ${label}` }));
  finishRegistrationPolicyReading();
  fireEvent.press(screen.getByRole("button", { name: `Close ${label}` }));
}
