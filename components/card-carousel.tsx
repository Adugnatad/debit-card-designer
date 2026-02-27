"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Wifi, Zap } from "lucide-react";

interface CardDesign {
  id: number;
  title: string;
  image: string;
  cardholder: string;
  cardNumber: string;
}

const cards: CardDesign[] = [
  {
    id: 1,
    title: "Sunset Panorama",
    image: "/Card.jpg",
    cardholder: "GELETA ABATE FULAS",
    cardNumber: "1234 5678 6789 1234",
  },
  {
    id: 2,
    title: "Alpine Heights",
    image: "/Card1.jpg",
    cardholder: "JOHN BUSINESS",
    cardNumber: "5678 1234 5678 9012",
  },
  {
    id: 3,
    title: "City Lights",
    image: "/Card2.jpg",
    cardholder: "AMINA MOHAMED",
    cardNumber: "9012 5678 1234 3456",
  },
  {
    id: 4,
    title: "Ethiopian Pride",
    image: "/Card3.jpg",
    cardholder: "TEFERA KEBEDE",
    cardNumber: "3456 9012 5678 7890",
  },
  {
    id: 5,
    title: "Nature's Embrace",
    image: "/Card4.jpg",
    cardholder: "LILY JOHNSON",
    cardNumber: "7890 3456 9012 1234",
  },
  {
    id: 6,
    title: "Abstract Waves",
    image: "/Card5.jpg",
    cardholder: "DAVID SMITH",
    cardNumber: "1234 7890 3456 5678",
  },
  {
    id: 7,
    title: "Cultural Mosaic",
    image: "/Card6.jpg",
    cardholder: "SARAH ABDUL",
    cardNumber: "5678 1234 7890 9012",
  },
];

export function CardCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="flex flex-col items-center gap-8 py-12 w-full">
      <div className="relative w-[395px] md:min-w-[500px]  h-[85%] ">
        {/* Card */}
        <div className="relative w-full aspect-[1.586] rounded-3xl overflow-hidden shadow-2xl group">
          {/* Background Image */}
          <Image
            src={currentCard.image}
            alt={currentCard.title}
            fill
            loading="lazy"
            decoding="async"
            className="object-cover"
          />

          {/* Dark overlay for text readability */}
          {/* <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50" /> */}

          {/* Card Content */}
          <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-10">
            <div className="flex justify-between items-start">
              <div
                className="absolute"
                data-layer-id="chip"
                style={{
                  left: 30,
                  top: 80,
                  width: 70,
                  height: 70,
                  zIndex: 10,
                }}
                aria-label="Card chip"
              >
                <img
                  src="/images/chip.png"
                  alt="EMV chip"
                  className="h-full w-full object-contain opacity-90"
                  draggable={false}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div
                className="text-white font-bold text-2xl md:text-3xl tracking-widest"
                style={{
                  letterSpacing: "0.12em",
                }}
              >
                {currentCard.cardNumber}
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <div className="text-white/70 text-xs uppercase tracking-widest mb-2">
                    Card Holder
                  </div>
                  <div className="text-white font-serif text-xl md:text-2xl font-bold">
                    {currentCard.cardholder}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute -left-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black text-white p-2 rounded-full transition hidden md:flex items-center justify-center z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="absolute -right-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black text-white p-2 rounded-full transition hidden md:flex items-center justify-center z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Card Title and Index */}
      {/* <div className="text-center">
        <p className="text-gray-300 text-sm md:text-base">
          {currentCard.title} — {currentIndex + 1}/{cards.length}
        </p>
      </div> */}

      {/* Carousel Indicators */}
      <div className="flex gap-2 justify-center">
        {cards.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex
                ? "bg-amber-500 w-8"
                : "bg-gray-300 w-2 hover:bg-gray-400"
            }`}
            aria-label={`Go to card ${idx + 1}`}
          />
        ))}
      </div>

      {/* Mobile Navigation Buttons */}
      <div className="flex gap-4 md:hidden w-full max-w-md">
        <button
          onClick={handlePrev}
          className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
}
