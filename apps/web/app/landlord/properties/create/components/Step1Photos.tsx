"use client";
import { useRef } from "react";
import NextImage from "next/image";
import { Button } from "@heroui/react";
import { Input } from "@heroui/react";
import { Upload, X, ImagePlus } from "lucide-react";
import type { ApartmentFormData, FormErrors } from "../page";

interface Props {
  formData: ApartmentFormData;
  updateForm: (updates: Partial<ApartmentFormData>) => void;
  errors: FormErrors
}

export default function Step1Photos({ formData, updateForm, errors }: Props) {
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const additionalRef = useRef<HTMLInputElement>(null);

  const thumbnailPreview = formData.thumbnail
    ? URL.createObjectURL(formData.thumbnail)
    : null;

  const additionalPreviews = formData.additionalPhotos.map((f) =>
    URL.createObjectURL(f)
  );

  const handleThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateForm({ thumbnail: file });
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const handleAdditional = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    updateForm({ additionalPhotos: [...formData.additionalPhotos, ...files] });
    e.target.value = "";
  };

  const removeAdditional = (index: number) => {
    updateForm({
      additionalPhotos: formData.additionalPhotos.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-medium font-noto-serif text-primary mb-1">
          Photos & Title
        </h2>
        <p className="text-grey-500 text-sm">
          Add a cover photo and additional images, then give your listing a name.
        </p>
      </div>

      {/* Listing Title */}
      <Input
        label="Listing Title"
        placeholder="e.g. Cozy 1BR Studio near BGC"
        value={formData.name}
        onValueChange={(v) => updateForm({ name: v })}
        radius="lg"
        variant="bordered"
        description="This is the first thing tenants will see."
        classNames={{
          inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
        }}
        errorMessage={errors.name}
        isInvalid={!!errors.name}
      />

      {/* Cover / Thumbnail */}
      <div>
        <p className="text-sm font-medium mb-2">
          Thumbnail Photo <span className="text-danger">*</span>
        </p>
        <Input
          ref={thumbnailRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleThumbnail}
        />

        {thumbnailPreview ? (
          <div className="relative w-full h-72 rounded-2xl overflow-hidden group">
            <NextImage
              src={thumbnailPreview}
              alt="Cover"
              fill
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
            <Button
              isIconOnly
              size="sm"
              radius="full"
              className="absolute top-3 right-3 bg-black/60 text-white hover:bg-black/80"
              onPress={() => updateForm({ thumbnail: null })}
            >
              <X size={14} />
            </Button>
            <Button
              size="sm"
              radius="full"
              className="absolute bottom-3 right-3 bg-white/90 text-grey-800 opacity-0 group-hover:opacity-100 transition"
              onPress={() => thumbnailRef.current?.click()}
            >
              Change photo
            </Button>
          </div>
        ) : (
          <div
            className={`w-full h-72 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition ${
              errors.thumbnail
                ? "border-danger bg-danger/5"
                : "border-grey-300 hover:border-primary hover:bg-primary/5"
            }`}
            onClick={() => thumbnailRef.current?.click()}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Upload size={22} className="text-primary" />
            </div>
            <p className="text-grey-600 font-medium text-sm">Click to upload cover photo</p>
            <p className="text-grey-400 text-xs mt-1">PNG, JPG up to 10MB</p>
          </div>
        )}

        {/* Error message below the upload box */}
        {errors.thumbnail && (
          <p className="text-danger text-xs mt-1.5">{errors.thumbnail}</p>
        )}
      </div>

      {/* Additional Photos */}
      <div>
        <p className="text-sm font-medium mb-2">
          Additional Photos <span className="text-danger">*</span>
        </p>
        <input
          ref={additionalRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleAdditional}
        />

        <div className="grid grid-cols-3 gap-3">
          {additionalPreviews.map((src, i) => (
            <div key={i} className="relative h-32 rounded-xl overflow-hidden group">
              <NextImage
                src={src}
                alt={`Photo ${i + 1}`}
                fill
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
              <Button
                isIconOnly
                size="sm"
                radius="full"
                className="absolute top-1.5 right-1.5 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                onPress={() => removeAdditional(i)}
              >
                <X size={12} />
              </Button>
            </div>
          ))}

          {/* Add more */}
          <div
            className="h-32 border-2 border-dashed border-grey-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
            onClick={() => additionalRef.current?.click()}
          >
            <ImagePlus size={20} className="text-grey-400 mb-1" />
            <p className="text-grey-400 text-xs">Add photo</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          {formData.additionalPhotos.length > 0 ? (
            <p className="text-xs text-grey-400">
              {formData.additionalPhotos.length} photo{formData.additionalPhotos.length !== 1 ? "s" : ""} added
              {formData.additionalPhotos.length < 2 && (
                <span className="text-warning ml-1">— add {2 - formData.additionalPhotos.length} more</span>
              )}
            </p>
          ) : (
            <p className="text-xs text-grey-400">Minimum 3 additional photos required</p>
          )}
        </div>

        {errors.additionalPhotos && (
          <p className="text-danger text-xs mt-1.5">{errors.additionalPhotos}</p>
        )}
      </div>
    </div>
  );
}
