import type { ReactNode } from "react";
import { View } from "react-native";
import { Dialog } from "heroui-native";

type AppDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleIcon?: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AppDialog({
  isOpen,
  onOpenChange,
  title,
  titleIcon,
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
          {children}
          {footer ? <View className="mt-5">{footer}</View> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
