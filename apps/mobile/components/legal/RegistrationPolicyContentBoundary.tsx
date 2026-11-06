import { Component, type ReactNode } from "react";
import { Text } from "react-native";

interface RegistrationPolicyContentBoundaryProps {
  children: ReactNode;
  onError: () => void;
}

export default class RegistrationPolicyContentBoundary extends Component<RegistrationPolicyContentBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Could not display registration policy", { name: error.name });
    this.props.onError();
  }

  render() {
    if (this.state.failed) {
      return <Text accessibilityRole="alert" className="flex-1 text-sm text-foreground leading-6">
        We could not display this policy. Close and open it again to try again. Your form will stay unchanged.
      </Text>;
    }
    return this.props.children;
  }
}
