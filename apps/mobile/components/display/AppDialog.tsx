import { use, type ReactNode } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Dialog } from "heroui-native";

/** Keeps a tall body on screen; the title, close button and footer stay fixed. */
export const SCROLLABLE_BODY_MAX_HEIGHT = 360;
const VIEWPORT_GUTTER = 20;
const VIEWPORT_DIALOG_MAX_WIDTH = 448;
const CLOSE_TARGET_SIZE = 44;
const ZERO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

type AppDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Centered headings join the scrollable body, below fixed close clearance. */
  titleLayout?: "default" | "centered";
  /** Optional artwork above the title, in the same scrollable heading block. */
  titleIllustration?: ReactNode;
  titleIcon?: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Wraps the body in a max-height scroll area for long content. */
  scrollable?: boolean;
  /** Bounds the whole card to the safe viewport; only its body can shrink. */
  fitToViewport?: boolean;
  /** When false, only the footer actions close it: no close button, backdrop tap, swipe or back press. */
  dismissible?: boolean;
};

const IGNORE_OPEN_CHANGE = () => {};

export default function AppDialog({
  isOpen,
  onOpenChange,
  title,
  titleLayout = "default",
  titleIllustration,
  titleIcon,
  description,
  children,
  footer,
  scrollable = false,
  fitToViewport = false,
  dismissible = true,
}: AppDialogProps) {
  const { height } = useWindowDimensions();
  // Existing non-viewport dialogs can also be used outside a SafeAreaProvider.
  const insets = fitToViewport ? use(SafeAreaInsetsContext) ?? ZERO_INSETS : ZERO_INSETS;
  const centeredTitle = titleLayout === "centered";
  const heading = (
    <View
      className={centeredTitle ? "mb-5 items-center gap-3" : fitToViewport ? "mb-5 gap-1 pr-12" : titleIcon ? "mb-5 gap-1 pr-10" : "mb-5 gap-1"}
      style={fitToViewport || centeredTitle ? {
        flexShrink: 0,
        minHeight: CLOSE_TARGET_SIZE,
        justifyContent: "center",
        paddingTop: centeredTitle && !scrollable ? CLOSE_TARGET_SIZE : 0,
      } : undefined}
    >
      {titleIllustration}
      <View className={centeredTitle ? "flex-row items-center justify-center gap-2" : "flex-row items-center gap-2"}>
        {titleIcon}
        <Dialog.Title
          className={centeredTitle ? "text-center text-foreground font-nunitoBold text-2xl" : "text-foreground font-nunitoBold text-lg"}
          style={fitToViewport || centeredTitle ? { flexShrink: 1 } : undefined}
        >
          {title}
        </Dialog.Title>
      </View>
      {description ? (
        <Dialog.Description className="text-muted">
          {description}
        </Dialog.Description>
      ) : null}
    </View>
  );
  return (
    <Dialog isOpen={isOpen} onOpenChange={dismissible ? onOpenChange : IGNORE_OPEN_CHANGE}>
      <Dialog.Portal style={fitToViewport ? {
        paddingTop: insets.top + VIEWPORT_GUTTER,
        paddingBottom: insets.bottom + VIEWPORT_GUTTER,
        paddingLeft: Math.max(insets.left, VIEWPORT_GUTTER),
        paddingRight: Math.max(insets.right, VIEWPORT_GUTTER),
      } : undefined}>
        <Dialog.Overlay className="bg-backdrop items-center justify-center px-6" />
        <Dialog.Content
          className="w-full rounded-3xl bg-surface-secondary p-5"
          isSwipeable={dismissible}
          style={fitToViewport ? {
            maxHeight: Math.max(0, height - insets.top - insets.bottom - VIEWPORT_GUTTER * 2),
            maxWidth: VIEWPORT_DIALOG_MAX_WIDTH,
            alignSelf: "center",
          } : undefined}
        >
          {dismissible ? (
            <Dialog.Close
              variant="ghost"
              accessibilityLabel="Close"
              className="absolute top-4 right-4 z-50"
              style={fitToViewport ? { width: CLOSE_TARGET_SIZE, height: CLOSE_TARGET_SIZE, top: 12, right: 12 } : undefined}
            />
          ) : null}
          {centeredTitle && scrollable ? <View style={{ height: CLOSE_TARGET_SIZE, flexShrink: 0 }} /> : heading}
          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator
              style={fitToViewport ? { flexShrink: 1 } : { maxHeight: SCROLLABLE_BODY_MAX_HEIGHT }}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              {centeredTitle ? heading : null}
              {children}
            </ScrollView>
          ) : (
            children
          )}
          {footer ? <View className="mt-5" style={fitToViewport ? { flexShrink: 0 } : undefined}>{footer}</View> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
