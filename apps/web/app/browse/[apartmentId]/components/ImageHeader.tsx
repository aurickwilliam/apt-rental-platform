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
            className="object-cover hover:brightness-90 transition rounded-2xl"
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
              className="object-cover hover:brightness-90 transition rounded-2xl"
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
              className="object-cover hover:brightness-90 transition rounded-2xl"
            />
            <Button
              variant="tertiary"
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
      <Modal>
        <Modal.Backdrop
          isOpen={state.isOpen}
          onOpenChange={state.setOpen}
          className="bg-black/80"
        >
          <Modal.Container
            size="cover"
            className="bg-transparent p-0 shadow-none"
          >
            <Modal.Dialog className="bg-transparent h-full flex flex-col justify-center">
              <Modal.Body className="p-0 h-full flex flex-col justify-center">

                {/* Outer layout: buttons + white box */}
                <div className="flex items-center justify-center gap-4 w-full px-8">
                  {/* Left button — outside the white box */}
                  <Button
                    isIconOnly
                    variant="ghost"
                    className="rounded-full bg-white/20 hover:bg-white/40 text-white shrink-0"
                    onPress={() =>
                      setActiveIndex(
                        (prev) => (prev - 1 + imageUrl.length) % imageUrl.length
                      )
                    }
                  >
                    <ChevronLeft size={20} />
                  </Button>

                  {/* White card — 2/3 width */}
                  <div className="w-2/3 bg-white rounded-2xl overflow-hidden flex flex-col relative p-4">
                    {/* Close Button */}
                    <div className="absolute top-1 right-1 z-10">
                      <Modal.CloseTrigger className="text-black" />
                    </div>

                    {/* Main image */}
                    <div className="relative w-full h-[65vh]">
                      <NextImage
                        src={imageUrl[activeIndex]}
                        alt="Apartment Image"
                        fill
                        className="object-contain"
                      />
                    </div>

                    {/* Thumbnails */}
                    <div className="flex gap-2 overflow-x-auto justify-start pt-3">
                      {imageUrl.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveIndex(index)}
                          className={`relative w-24 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                            activeIndex === index
                              ? "border-primary opacity-100"
                              : "border-transparent opacity-50 hover:opacity-75"
                          }`}
                        >
                          <NextImage
                            src={url}
                            alt={`Thumbnail ${index}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>

                  </div>

                  {/* Right button — outside the white box */}
                  <Button
                    isIconOnly
                    variant="ghost"
                    className="rounded-full bg-white/20 hover:bg-white/40 text-white shrink-0"
                    onPress={() =>
                      setActiveIndex((prev) => (prev + 1) % imageUrl.length)
                    }
                  >
                    <ChevronRight size={20} />
                  </Button>

                </div>

              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}