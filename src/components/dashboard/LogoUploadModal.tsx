import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
  selectedImage: File | null;
  previewUrl: string | null;
  propertyName: string;
  isUploading?: boolean; // Add this prop
}

export const LogoUploadModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedImage,
  previewUrl,
  propertyName,
  isUploading = false, // Add default value
}: LogoUploadModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Logo for {propertyName}</DialogTitle>
          <DialogDescription>
            Preview and confirm your logo upload
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {previewUrl && (
            <div className="w-full aspect-video relative rounded-lg overflow-hidden border-2 border-muted">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Logo preview"
                className="w-full h-full object-contain bg-white"
              />
            </div>
          )}
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedImage && onConfirm(selectedImage)}
            className="bg-[#38b000] hover:bg-[#38b000]/90 text-white"
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Logo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
