"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint } from "@fortawesome/free-solid-svg-icons";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import axios from "axios";

const API_BASE_URL = "https://9r7j860h-8000.uks1.devtunnels.ms/api/v1/confirmed-cards/";

const CustomerCardTable = () => {
  const [selectedTab, setSelectedTab] = useState("individual");
  const [selectedCard, setSelectedCard] = useState(null);
  const [individualCustomers, setIndividualCustomers] = useState([]);
  const [groupCustomers, setGroupCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = async (type) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}${type}/`);
      if (type === "group") {
        setIndividualCustomers(response.data);
        console.log(response.data);
        // console.log(response);
        if (response.data.length > 0) {
          setSelectedCard(response.data[0].cardImg);
        }
      } else {
        setGroupCustomers(response.data);
        if (response.data.length > 0) {
          setSelectedCard(response.data[0].cardImg);
        }
      }
    } catch (err) {
      setError(`Failed to fetch ${type} customers.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(selectedTab);
  }, [selectedTab]);

  const handlePrint = () => {
    if (!selectedCard) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Allow pop-ups for this site to print.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Image</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <img src="${selectedCard}" alt="Selected Card" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-4 p-6">
      <div className="col-span-8 bg-white p-4 rounded-lg shadow-md">
        <Tabs defaultValue="individual" onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="individual" className="text-lg font-semibold">Individual</TabsTrigger>
            <TabsTrigger value="group" className="text-lg font-semibold">Group</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <p>Loading {selectedTab} customers...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : selectedTab === "individual" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Print</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {individualCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-gray-100"
                  
                  onClick={() => setSelectedCard(`${API_BASE_URL}${customer.image}`)}
                  >
                  <TableCell>{customer.user_name}</TableCell>
                  <TableCell>{customer.accountNumber}</TableCell>
                  <TableCell>{customer.phoneNumber}</TableCell>
                  <TableCell>
                    <button onClick={handlePrint} className="text-lg text-blue-500 hover:underline">
                      <FontAwesomeIcon icon={faPrint} className="text-lg" />
                    </button>
                  </TableCell>
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
                <TableHead>Print</TableHead>
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
                    {index === 0 && (
                      <>
                        <TableCell rowSpan={group.members.length}>{group.groupName}</TableCell>
                        <TableCell rowSpan={group.members.length}>{group.created_by}</TableCell>
                      </>
                    )}
                    <TableCell>{member}</TableCell>
                    <TableCell>{group.phone_numbers[index]}</TableCell>
                    {index === 0 && (
                      <TableCell rowSpan={group.members.length}>
                        <button onClick={handlePrint} className="text-lg text-blue-500 hover:underline">
                          <FontAwesomeIcon icon={faPrint} className="text-lg" />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Card Preview Section */}
      <div className="w-full mb-4 md:mb-0 md:col-span-4 flex items-center justify-center bg-gray-100 p-4 rounded-lg shadow-md">
        {selectedCard ? (
          <Image
          src={`${API_BASE_URL}${selectedCard}`} // Ensure the full path is used
          alt="Selected Card"
            width={400}
            height={250}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        ) : (
          <p>No card selected</p>
        )}
      </div>
    </div>
  );
};

export default CustomerCardTable;
