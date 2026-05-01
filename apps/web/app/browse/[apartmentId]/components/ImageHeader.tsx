"use client";
import { Image, Button, Modal, ModalContent, useDisclosure } from "@heroui/react";

import NextImage from "next/image";
import { useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageHeaderProps {
  imageUrl: string[];
}

export default function ImageHeader({ imageUrl }: ImageHeaderProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleImagePress = (index: number) => {
    setActiveIndex(index);
    onOpen();
  };

  return (
    <>
      <div className="w-full h-128 relative flex gap-5">
        <div
          className="w-2/3 relative h-full cursor-pointer"
          onClick={() => handleImagePress(0)}
        >
          <Image
            as={NextImage}
            src={imageUrl[0]}
            alt="Apartment Image"
            fill
            removeWrapper
            className="object-cover hover:brightness-90 transition"
          />
        </div>
        <div className="w-1/3 flex flex-col gap-5">
          <div
            className="relative h-1/2 cursor-pointer"
            onClick={() => handleImagePress(1)}
          >
            <Image
              as={NextImage}
              src={imageUrl[1]}
              alt="Apartment Image"
              fill
              removeWrapper
              className="object-cover hover:brightness-90 transition"
            />
          </div>
          <div
            className="relative h-1/2 cursor-pointer"
            onClick={() => handleImagePress(2)}
          >
            <Image
              as={NextImage}
              src={imageUrl[2]}
              alt="Apartment Image"
              fill
              removeWrapper
              className="object-cover hover:brightness-90 transition"
            />
            <Button
              variant="faded"
              radius="full"
              className="absolute bottom-2 right-2 z-10"
              size="sm"
              onPress={() => handleImagePress(2)}
            >
              See more photos
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="5xl"
        hideCloseButton={false}
        classNames={{
          body: "p-3",
          base: "bg-white overflow-hidden",
          wrapper: "overflow-hidden",
          closeButton: "z-50 cursor-pointer"
        }}
      >
        <ModalContent>
          <div className="relative flex items-center justify-center px-5 pt-10 gap-5"> 
            <Button
              isIconOnly
              variant="flat"
              radius="full"
              className=" bg-white/20 border border-gray-300 z-10"
              onPress={() => setActiveIndex((prev) => (prev - 1 + imageUrl.length) % imageUrl.length)}
            >
              <ChevronLeft size={24} />
            </Button>

            {/* Main Image */}
            <div className="relative flex-1 h-[70vh]">
              <Image
                as={NextImage}
                src={imageUrl[activeIndex]}
                alt="Apartment Image"
                fill
                removeWrapper
                className="object-cover bg-black/10"
                radius="lg"
              />
            </div>

            <Button
              isIconOnly
              variant="flat"
              radius="full"
              className=" bg-white/20 border border-grey-300 z-10"
              onPress={() => setActiveIndex((prev) => (prev + 1) % imageUrl.length)}
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
                  activeIndex === index ? "border-gray-300" : "border-transparent opacity-60"
                }`}
                onClick={() => setActiveIndex(index)}
              >
                <Image
                  as={NextImage}
                  src={url}
                  alt={`Thumbnail ${index}`}
                  fill
                  removeWrapper
                  className="object-cover"
                  radius="none"
                />
              </div>
            ))}
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
