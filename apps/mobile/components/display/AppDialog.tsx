import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { Dialog } from "heroui-native";

/** Keeps a tall body on screen; the title, close button and footer stay fixed. */
export const SCROLLABLE_BODY_MAX_HEIGHT = 360;

type AppDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleIcon?: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Wraps the body in a max-height scroll area for long content. */
  scrollable?: boolean;
};

export default function AppDialog({
  isOpen,
  onOpenChange,
  title,
  titleIcon,
  description,
  children,
  footer,
  scrollable = false,
}: AppDialogProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-backdrop items-center justify-center px-6" />
        <Dialog.Content className="w-full rounded-3xl bg-surface-secondary p-5">
          <Dialog.Close variant="ghost" className="absolute top-4 right-4 z-50" />
          <View className={titleIcon ? "mb-5 gap-1 pr-10" : "mb-5 gap-1"}>
            <View className="flex-row items-center gap-2">
              {titleIcon}
              <Dialog.Title className="text-foreground font-nunitoBold text-lg">
                {title}
              </Dialog.Title>
            </View>
            {description ? (
              <Dialog.Description className="text-muted">
                {description}
              </Dialog.Description>
            ) : null}
          </View>
          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator
              style={{ maxHeight: SCROLLABLE_BODY_MAX_HEIGHT }}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              {children}
            </ScrollView>
          ) : (
            children
          )}
          {footer ? <View className="mt-5">{footer}</View> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
