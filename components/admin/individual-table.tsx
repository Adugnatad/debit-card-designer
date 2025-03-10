"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

const individualCustomers = [
  { id: 1, name: "John Doe", account: "123456", cardImg: "/card1.jpg" },
  { id: 2, name: "Jane Smith", account: "789012", cardImg: "/card2.jpg" },
];

const groupCustomers = [
  { id: 1, groupName: "Team Alpha",created_by:"www", members: ["www","bbbb"],phone_numbers:["0968034653","091111111"], cardImg: "/card1.jpg" },
  { id: 2, groupName: "Team Beta", created_by:"bbbb",members: ["cccc","ddddd"],phone_numbers:["0968034653","091111111"], cardImg: "/card2.jpg" },
];

const CustomerCardTable = () => {
  const [selectedTab, setSelectedTab] = useState("individual");
  const [selectedCard, setSelectedCard] = useState(individualCustomers[0].cardImg);

  return (
    <div className="grid grid-cols-12 gap-4 p-6">
      {/* Tabs Section */}
      <div className="col-span-8">
        <Tabs defaultValue="individual" onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-2  ">
            <TabsTrigger value="individual"  className="text-lg font-semibold mb-4">Individual</TabsTrigger>
            <TabsTrigger value="group" className="text-lg font-semibold mb-4">Group</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table Above the Main Section Based on Selected Tab */}
      <div className="col-span-8 bg-white p-4 rounded-lg shadow-md">
        {selectedTab === "individual" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {individualCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedCard(customer.cardImg)}
                >
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.account}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Members Name</TableHead>
                <TableHead>Phone Number</TableHead>


              </TableRow>
            </TableHeader>
            <TableBody>
              {groupCustomers.map((group) => (
                group.members.map((member, index) => (
                  <TableRow
                    key={`${group.id}-${index}`}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setSelectedCard(group.cardImg)}
                  >
                    {/* Only add rowspan for the first row of each group */}
                    {index === 0 && (
                      <>
                        <TableCell rowSpan={group.members.length}>{group.groupName}</TableCell>
                        <TableCell rowSpan={group.members.length}>{group.created_by}</TableCell>
                      </>
                    )}
                    <TableCell>{member}</TableCell>
                    <TableCell>{group.phone_numbers[index]}</TableCell>



                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
          
        )}
      </div>



      {/* Card Preview Section */}
      <div className="col-span-4 flex items-center justify-center bg-gray-100 p-4 rounded-lg shadow-md">
        <Image
          src={selectedCard}
          alt="Selected Card"
          width={400}
          height={250}
          className="w-full h-auto rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};

export default CustomerCardTable;
