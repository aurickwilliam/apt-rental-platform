"use client";

import { useState } from "react";
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button 
} from "@heroui/react";
import { FileUp, Trash2 } from "lucide-react";
import { createBrowserClient } from "@repo/supabase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  apartmentId: string;
  currentUrl?: string | null;
  onUpdated: (newUrl: string | null) => void;
};

export default function LeaseAgreementModal({ isOpen, onClose, apartmentId, currentUrl, onUpdated }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const supabase = createBrowserClient();

  const handleSave = async () => {
    if (!file) return;
    if (file.size === 0) {
      alert("Selected file is empty.");
      return;
    }

    setSaving(true);
    try {
      // If there's an existing file, we could delete it first to save space, but let's just upload new first.
      const ext = file.name.split('.').pop();
      const fileName = `${apartmentId}-${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("lease-agreements")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const newUrl = uploadData.path;

      const { error: updateError } = await supabase
        .from("apartments")
        .update({ lease_agreement_url: newUrl })
        .eq("id", apartmentId);

      if (updateError) throw updateError;

      // Delete the old file if it exists
      if (currentUrl) {
        await supabase.storage.from("lease-agreements").remove([currentUrl]);
      }

      onUpdated(newUrl);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to upload lease agreement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUrl) return;

    setDeleting(true);
    try {
      const { error: updateError } = await supabase
        .from("apartments")
        .update({ lease_agreement_url: null })
        .eq("id", apartmentId);
      
      if (updateError) throw updateError;

      const { error: removeError } = await supabase.storage
        .from("lease-agreements")
        .remove([currentUrl]);

      if (removeError) {
        console.error("Failed to delete from storage, but database updated:", removeError);
      }

      onUpdated(null);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to delete lease agreement.");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFile(null);
      onClose();
    }
  };

  const isSaveDisabled = !file || file.size === 0;

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Manage Lease Agreement</ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {currentUrl && (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-default-50">
                    <div className="text-sm font-medium">Current Lease Uploaded</div>
                    <Button 
                      isIconOnly 
                      color="danger" 
                      variant="flat" 
                      size="sm" 
                      isLoading={deleting}
                      onPress={handleDelete}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Upload New Lease Agreement</p>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-default-50 hover:border-primary transition-all">
                    <FileUp size={24} className="text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">Click to select file</span>
                    <span className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX up to 10MB</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {file && (
                    <div className="text-sm text-primary font-medium mt-1 truncate">
                      Selected: {file.name}
                    </div>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onCloseModal}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSave} isLoading={saving} isDisabled={isSaveDisabled}>
                Save Details
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
