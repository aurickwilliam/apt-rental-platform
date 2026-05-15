"use client";
import { Button, Modal, useOverlayState } from "@heroui/react";
import NextImage from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageHeaderProps {
  imageUrl: string[];
}

export default function ImageHeader({ imageUrl }: ImageHeaderProps) {
  const state = useOverlayState();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleImagePress = (index: number) => {
    setActiveIndex(index);
    state.open();
  };

  return (
    <>
      <div className="w-full h-128 relative flex gap-5">
        <div
          className="w-2/3 relative h-full cursor-pointer"
          onClick={() => handleImagePress(0)}
        >
          <NextImage
            src={imageUrl[0]}
            alt="Apartment Image"
            fill
            className="object-cover hover:brightness-90 transition"
          />
        </div>
        <div className="w-1/3 flex flex-col gap-5">
          <div
            className="relative h-1/2 cursor-pointer"
            onClick={() => handleImagePress(1)}
          >
            <NextImage
              src={imageUrl[1]}
              alt="Apartment Image"
              fill
              className="object-cover hover:brightness-90 transition"
            />
          </div>
          <div
            className="relative h-1/2 cursor-pointer"
            onClick={() => handleImagePress(2)}
          >
            <NextImage
              src={imageUrl[2]}
              alt="Apartment Image"
              fill
              className="object-cover hover:brightness-90 transition"
            />
            <Button
              variant="secondary"
              className="absolute bottom-2 right-2 z-10 rounded-full"
              size="sm"
              onPress={() => handleImagePress(2)}
            >
              See more photos
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <Modal.Backdrop 
        isOpen={state.isOpen} 
        onOpenChange={state.setOpen}
      >
        <Modal.Container 
          size="lg" 
          className="bg-white overflow-hidden"
        >
          <Modal.Dialog>
            {({ close }) => (
              <Modal.Body className="p-3">
                <div className="relative flex items-center justify-center px-5 pt-10 gap-5">
                  <Button
                    isIconOnly
                    variant="ghost"
                    className="border border-gray-300 z-10 rounded-full"
                    onPress={close}
                  >
                    <ChevronLeft size={24} />
                  </Button>

                  <div className="relative flex-1 h-[70vh]">
                    <NextImage
                      src={imageUrl[activeIndex]}
                      alt="Apartment Image"
                      fill
                      className="object-cover bg-black/10 rounded-lg"
                    />
                  </div>

                  <Button
                    isIconOnly
                    variant="ghost"
                    className="border border-gray-300 z-10 rounded-full"
                    onPress={() =>
                      setActiveIndex((prev) => (prev + 1) % imageUrl.length)
                    }
                  >
                    <ChevronRight size={24} />
                  </Button>
                </div>

                {/* Thumbnail Strip */}
                <div className="flex gap-2 p-3 overflow-x-auto bg-white rounded-b-xl">
                  {imageUrl.map((url, index) => (
                    <div
                      key={index}
                      className={`relative w-20 h-14 shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition ${
                        activeIndex === index
                          ? "border-gray-300"
                          : "border-transparent opacity-60"
                      }`}
                      onClick={() => setActiveIndex(index)}
                    >
                      <NextImage
                        src={url}
                        alt={`Thumbnail ${index}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </Modal.Body>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}