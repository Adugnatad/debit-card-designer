"use client";

import {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { motion, type PanInfo } from "framer-motion";
import { CreditCard } from "lucide-react";
import type { CardDesign } from "@/components/card-designer";
// import html2canvas from "html2canvas";
import * as htmlToImage from "html-to-image";
import { Button } from "./ui/button";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import Image from "next/image";
import axios from "axios";

interface CardPreviewProps {
  design: CardDesign;
  isTemplate?: boolean;
  groupImage?: string;
  galleryImage?: string;
  groupCreator?: string;
  onTextPositionChange?: (position: { x: number; y: number }) => void;
  onLogoPositionChange?: (position: { x: number; y: number }) => void;
  isDraggable?: boolean;
  ref?: any;
}

export const CardPreview = forwardRef(
  (
    {
      design,
      isTemplate = false,
      groupImage,
      galleryImage,
      onTextPositionChange,
    }: CardPreviewProps,
    ref
  ) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({
      x: design.textPosition.x,
      y: design.textPosition.y,
    });
    const [logoPosition, setLogoPosition] = useState({
      x: design.logoPosition.x,
      y: design.logoPosition.y,
    });
    const [logoSize, setLogoSize] = useState({ width: 100, height: 100 });

    const [constraints, setConstraints] = useState({
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    });

    const [image, setImage] = useState<string | null>(null);
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

    // Update position when design changes
    useEffect(() => {
      setPosition({ x: design.textPosition.x, y: design.textPosition.y });
    }, [design.textPosition.x, design.textPosition.y]);

    // Set constraints based on card dimensions
    useEffect(() => {
      if (cardRef.current) {
        const { width, height } = cardRef.current.getBoundingClientRect();
        setConstraints({
          top: 10,
          left: 10,
          right: width - 10,
          bottom: height - 40, // Increased bottom margin to allow more space
        });
      }
    }, []);

    console.log(galleryImage);

    useEffect(() => {
      if (galleryImage) {
        const fetchImage = async () => {
          try {
            const response = await fetch(`${BASE_URL}${galleryImage}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setImage(url);
          } catch (error) {
            console.error("Error fetching image:", error);
          }
        };
        fetchImage();
      }
      return () => {
        if (image) {
          URL.revokeObjectURL(image);
        }
      };
    }, [galleryImage]);

    const handleDrag = (
      event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      // Update local position state during drag
      const newPosition = {
        x: position.x + info.delta.x,
        y: position.y + info.delta.y,
      };

      // Apply constraints manually
      const constrainedX = Math.max(
        constraints.left,
        Math.min(constraints.right, newPosition.x)
      );
      const constrainedY = Math.max(
        constraints.top,
        Math.min(constraints.bottom, newPosition.y)
      );

      setPosition({ x: constrainedX, y: constrainedY });
    };

    const handleDragEnd = (
      event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (onTextPositionChange) {
        // Pass the final position to the parent component
        onTextPositionChange(position);
      }
    };

    const handleCardScreenshot = async (): Promise<string> => {
      if (cardRef.current) {
        // Hide elements that should not be in the screenshot
        const elementsToHide = cardRef.current.querySelectorAll(
          ".hide-for-screenshot"
        );
        elementsToHide.forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });

        // Take the screenshot
        const canvas = await htmlToImage.toCanvas(cardRef.current);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );

        // Show the elements again
        elementsToHide.forEach(
          (el) => ((el as HTMLElement).style.display = "")
        );

        if (blob) {
          return URL.createObjectURL(blob);
        }
      }
      return "";
    };

    const handleScreenshot = async () => {
      if (cardRef.current) {
        // Take the screenshot

        if (cardRef.current) {
          htmlToImage
            .toJpeg(cardRef.current, { quality: 0.95 })
            .then((dataUrl) => {
              const link = document.createElement("a");
              link.download = "debit_card_design.jpeg";
              link.href = dataUrl;
              link.click();
            })
            .catch((error) => {
              console.error("Failed to generate image:", error);
            });
        }
      }
    };

    useImperativeHandle(ref, () => ({
      handleCardScreenshot,
    }));

    return (
      <div
        style={{
          width: "405px", // Minimum width of a credit card
          height: "259px", // Minimum height of a credit card
        }}
      >
        <div
          ref={cardRef}
          className="relative w-full aspect-[1.586/1] rounded-xl overflow-hidden shadow-lg "
          style={{
            backgroundColor: design.backgroundColor,
            backgroundImage: groupImage
              ? `url(${BASE_URL}${groupImage})`
              : galleryImage
              ? `url(${image})`
              : `url(${design.backgroundImage})`,
            backgroundSize: "100%",
            backgroundPosition: "center",
          }}
        >
          {/* Image upload input */}
          {/* <input type="file" accept="image/*" onChange={handleImageUpload} /> */}
          {/* Display uploaded image */}
          {/* {image && (
            <motion.img
              src={image}
              alt="Uploaded"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                x: position.x + 50,
                y: position.y + 50,
                // width: imageSize.width,
                // height: imageSize.height,
                cursor: "move",
                userSelect: "none",
              }}
              drag
              dragMomentum={false}
              dragElastic={0}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
            />
          )} */}
          <motion.div drag dragMomentum={false}>
            {/* Bank logo placeholder */}
            <div className="absolute top-4 right-4  p-2 rounded-md hide-for-screenshot cursor-move">
              <Image
                src="/coop_logo.svg"
                alt="Coop Logo"
                width={50}
                height={50}
              />
            </div>
          </motion.div>
          {/* Chip and contactless symbols */}
          <div className="absolute top-16 left-6 hide-for-screenshot">
            <div className="w-10 h-8 bg-yellow-300/90 </div>rounded-md"></div>
          </div>
          {/* Card number placeholder */}
          <div
            style={{
              display: "inline-block",
            }}
            className="absolute bottom-20 left-6 right-6 hide-for-screenshot"
          >
            <div className="flex justify-between">
              <div className="w-10 h-3 bg-white/50 rounded-sm"></div>
              <div className="w-10 h-3 bg-white/50 rounded-sm"></div>
              <div className="w-10 h-3 bg-white/50 rounded-sm"></div>
              <div className="w-10 h-3 bg-white/50 rounded-sm"></div>
            </div>
          </div>
          {/* Expiry date placeholder */}
          <div className="absolute bottom-8 left-6 hide-for-screenshot">
            <div
              className="text-xs"
              style={{
                color: `${design.cardDetailsTextColor}99`,
                fontFamily: `${design.fontFamily}`,
              }}
            >
              VALID THRU
            </div>
            <div
              className="text-sm"
              style={{
                color: design.cardDetailsTextColor,
                fontStyle: design.cardDetailsTextColor,
                fontFamily: design.fontFamily,
              }}
            >
              12/28
            </div>
          </div>
          {/* Custom text */}
          {!groupImage && (
            <motion.div
              drag
              dragMomentum={false}
              dragElastic={0}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                x: position.x,
                y: position.y,
                color: design.textColor,
                fontFamily: design.fontFamily,
                cursor: "move",
                userSelect: "none",
                fontSize: "1.25rem",
                fontWeight: "bold",
                textShadow: "0px 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              {design.customText}
            </motion.div>
          )}
          {design.logo && (
            <motion.div
              drag
              dragMomentum={false}
              onDragEnd={(event, info) => {
                setLogoPosition({
                  x: logoPosition.x + info.delta.x,
                  y: logoPosition.y + info.delta.y,
                });
              }}
              style={{
                position: "absolute",
                cursor: "move",
              }}
            >
              <ResizableBox
                width={logoSize.width}
                height={logoSize.height}
                lockAspectRatio
                resizeHandles={["nw"]}
                onResizeStop={(_, data) => {
                  setLogoSize({
                    width: data.size.width,
                    height: data.size.height,
                  });
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={BASE_URL + design.logo}
                  alt="Uploaded"
                  className="cursor-move"
                  style={{
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
              </ResizableBox>
            </motion.div>
          )}
        </div>
        {!isTemplate && (
          <>
            <Button onClick={handleScreenshot} className="mt-4">
              Take Screenshot
            </Button>

            <p className="text-sm text-gray-500 mt-4">
              This is a preview of how your card will look. You can drag the
              text to position it.
            </p>
          </>
        )}
      </div>
    );
  }
);
