import type { ReactNode } from "react";
import { View } from "react-native";
import { Dialog } from "heroui-native";

type AppDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AppDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: AppDialogProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-backdrop items-center justify-center px-6" />
        <Dialog.Content className="w-full rounded-3xl bg-surface-secondary p-5">
          <Dialog.Close variant="ghost" className="absolute top-4 right-4 z-50" />
          <View className="mb-5 gap-1">
            <Dialog.Title className="text-foreground font-nunitoBold text-lg">
              {title}
            </Dialog.Title>
            {description ? (
              <Dialog.Description className="text-muted">
                {description}
              </Dialog.Description>
            ) : null}
          </View>
          {children}
          {footer ? <View className="mt-5">{footer}</View> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
