"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CardSelector() {
  const [selectedCard, setSelectedCard] =
    useState<keyof typeof cardOptions>("university");
  const [showCardUniversity, setShowCardUniversity] = useState(0);

  const cardOptions = {
    university: {
      name: "University & Education",
      description:
        "Show your school pride with cards featuring your university or educational institution.",
      examples: [
        "Addis Ababa University",
        "Jimma University",
        "Oromia State University",
      ],
    },
    sports: {
      name: "Sports Teams",
      description:
        "Support your favorite sports teams with every purchase you make.",
      examples: [
        "Ethiopian Coffee SC",
        "Adama City FC",
        "Ethiopia National Team",
      ],
    },
    nonprofit: {
      name: "Nonprofit Organizations",
      description: "Help support causes you care about with every transaction.",
      examples: [
        "Ethiopian Red Cross",
        "Oromia Development Association",
        "Environmental Society of Ethiopia",
      ],
    },
    community: {
      name: "Community Groups",
      description: "Show your local pride and support community initiatives.",
      examples: [
        "Oromia Cultural Association",
        "Addis Chamber of Commerce",
        "Local Heritage Groups",
      ],
    },
  };

  const univeristyCards = [
    { asset: "Uni" },
    { asset: "Uni1" },
    { asset: "Card1" },
  ];

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-xl font-bold text-[#006241] mb-4">
        Choose Your Card Category
      </h2>
      <Tabs
        defaultValue="university"
        onValueChange={(value) =>
          setSelectedCard(value as keyof typeof cardOptions)
        }
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="university">Education</TabsTrigger>
          <TabsTrigger value="sports">Sports</TabsTrigger>
          <TabsTrigger value="nonprofit">Nonprofit</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        <TabsContent value="university" className="mt-0">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <div className="relative h-[200px] hsm:h-[281px] hsm:w-[415px]   rounded-lg overflow-hidden shadow-md mb-4">
                <Image
                  src={`/${univeristyCards[showCardUniversity].asset}.png?height=250&width=400&text=University Card`}
                  alt="University Card Example"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex gap-2 mb-4">
                {univeristyCards.map((asset, i) => (
                  <div
                    key={i}
                    onClick={() => setShowCardUniversity(i)}
                    className="relative h-16 w-24 rounded border overflow-hidden cursor-pointer"
                  >
                    <Image
                      src={`/${asset.asset}.png?height=64&width=96&text=Card ${i}`}
                      alt={`Card option ${i}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="text-lg font-semibold text-[#006241] mb-2">
                {cardOptions[selectedCard].name}
              </h3>
              <p className="text-gray-700 mb-4">
                {cardOptions[selectedCard].description}
              </p>
              <div className="mb-6">
                <h4 className="font-medium mb-2">Popular Options:</h4>
                <ul className="space-y-2">
                  {cardOptions[selectedCard].examples.map((example, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#006241] mr-2"></div>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
              {/* <Button className="bg-[#006241] hover:bg-[#004d33] text-white">
                Select This Category
              </Button> */}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sports" className="mt-0">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <div className="relative h-[200px] md:h-[250px] w-full rounded-lg overflow-hidden shadow-md mb-4">
                <Image
                  src="/placeholder.svg?height=250&width=400&text=Sports Card"
                  alt="Sports Card Example"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="relative h-16 w-24 rounded border overflow-hidden"
                  >
                    <Image
                      src={`/placeholder.svg?height=64&width=96&text=Card ${i}`}
                      alt={`Card option ${i}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="text-lg font-semibold text-[#006241] mb-2">
                {cardOptions[selectedCard].name}
              </h3>
              <p className="text-gray-700 mb-4">
                {cardOptions[selectedCard].description}
              </p>
              <div className="mb-6">
                <h4 className="font-medium mb-2">Popular Options:</h4>
                <ul className="space-y-2">
                  {cardOptions[selectedCard].examples.map((example, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#006241] mr-2"></div>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
              {/* <Button className="bg-[#006241] hover:bg-[#004d33] text-white">
                Select This Category
              </Button> */}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="nonprofit" className="mt-0">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <div className="relative h-[200px] md:h-[250px] w-full rounded-lg overflow-hidden shadow-md mb-4">
                <Image
                  src="/placeholder.svg?height=250&width=400&text=Nonprofit Card"
                  alt="Nonprofit Card Example"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="relative h-16 w-24 rounded border overflow-hidden"
                  >
                    <Image
                      src={`/placeholder.svg?height=64&width=96&text=Card ${i}`}
                      alt={`Card option ${i}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="text-lg font-semibold text-[#006241] mb-2">
                {cardOptions[selectedCard].name}
              </h3>
              <p className="text-gray-700 mb-4">
                {cardOptions[selectedCard].description}
              </p>
              <div className="mb-6">
                <h4 className="font-medium mb-2">Popular Options:</h4>
                <ul className="space-y-2">
                  {cardOptions[selectedCard].examples.map((example, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#006241] mr-2"></div>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
              {/* <Button className="bg-[#006241] hover:bg-[#004d33] text-white">
                Select This Category
              </Button> */}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="community" className="mt-0">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <div className="relative h-[200px] md:h-[250px] w-full rounded-lg overflow-hidden shadow-md mb-4">
                <Image
                  src="/placeholder.svg?height=250&width=400&text=Community Card"
                  alt="Community Card Example"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="relative h-16 w-24 rounded border overflow-hidden"
                  >
                    <Image
                      src={`/placeholder.svg?height=64&width=96&text=Card ${i}`}
                      alt={`Card option ${i}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="text-lg font-semibold text-[#006241] mb-2">
                {cardOptions[selectedCard].name}
              </h3>
              <p className="text-gray-700 mb-4">
                {cardOptions[selectedCard].description}
              </p>
              <div className="mb-6">
                <h4 className="font-medium mb-2">Popular Options:</h4>
                <ul className="space-y-2">
                  {cardOptions[selectedCard].examples.map((example, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#006241] mr-2"></div>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
              {/* <Button className="bg-[#006241] hover:bg-[#004d33] text-white">
                Select This Category
              </Button> */}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
