import { Button, Chip, Modal } from "@heroui/react";
import { PERKS } from "../../../../components/inputs/perks";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  amenityIds?: string[];
};

export default function AmenitiesModal({ isOpen, onClose, amenityIds = [] }: Props) {
  const amenities = amenityIds
    .map((id) => ({ id, perk: PERKS[id] }))
    .filter((item) => item.perk);

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.CloseTrigger className="text-black" />

                <Modal.Header>
                  <Modal.Heading className="font-medium text-2xl">
                    Amenities
                  </Modal.Heading>
                </Modal.Header>

                <Modal.Body>
                  {amenities.length === 0 ? (
                    <p className="text-sm text-default-700">—</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((item) => (
                        <Chip 
                          key={item.id} 
                          size="sm" 
                          variant="soft"
                          className="flex flex-row gap-1 px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100"
                        >
                          {item.perk?.icon && <item.perk.icon size={14} className="text-blue-500" />}
                          {item.perk?.name}
                        </Chip>
                      ))}
                    </div>
                  )}
                </Modal.Body>

                <Modal.Footer>
                  <Button 
                    variant="primary" 
                    onPress={close}
                  >
                    Close
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}