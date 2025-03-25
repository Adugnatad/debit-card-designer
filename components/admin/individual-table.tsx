"use-client"
import { useState, useEffect } from "react";
import {
  Table as CustomTable,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Pagination } from "flowbite-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import api from "@/lib/axiosInstance"; // Import API utility
const API_BASE_URL = "http://127.0.0.1:8000";

interface ConfirmedCard {
  card_id: string;
  user_name: string;
  status: string;
  pickup_location: string;
  debit_card_request_type: string;
  created_at: string;
  updated_at: string;
  image: string;
  account_number: string;
  phone_number: string;
}

interface GroupCustomer {
  groupId: string;
  creator: string;
  confirmed_cards: ConfirmedCard[];
  image: string;
}

const CardTable = () => {
  const [selectedTab, setSelectedTab] = useState<"individual" | "group">("individual");
  const [isMounted, setIsMounted] = useState(false);

  // Wait until component is mounted to access localStorage
  useEffect(() => {
    setIsMounted(true);
    const storedTab = localStorage.getItem("selectedTab") as "individual" | "group";
    if (storedTab) {
      setSelectedTab(storedTab);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("selectedTab", selectedTab);
    }
  }, [selectedTab, isMounted]);

  // if (!isMounted) return null; //
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("Confirmed");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [modalData, setModalData] = useState<{ isOpen: boolean; action: string; customer: ConfirmedCard  | null }>({ isOpen: false, action: "", customer: null });
  const [rejectReason, setRejectReason] = useState("");
  const [individualData, setIndividualData] = useState<ConfirmedCard[]>([]);
  const [groupData, setGroupData] = useState<GroupCustomer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/cards/confirmed-cards/${selectedTab}`);

        if (selectedTab === "individual") {
          setIndividualData(response.data);
        } else {
          setGroupData(response.data || []);
          localStorage.setItem("selectedTab", selectedTab); // Save selection to localStorage

        }
      } catch (err) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, selectedTab]);

  const handleModal = (action: string, customer: ConfirmedCard | GroupCustomer | null) => {
    setModalData({ isOpen: true, action, customer });
    if (action === "print" && customer && 'image' in customer) {
      setSelectedCard(`${API_BASE_URL}/media/${customer.image}`);
    }
    if (customer && 'card_id' in customer) {
      setSelectedCardId(customer.card_id); // If the customer has a card_id, set it
    }
  };

  const closeModal = () => {
    setModalData({ isOpen: false, action: "", customer: null });
    setRejectReason("");
  };

  const filteredIndividualData = individualData.filter((item) => {
    const statusMatch = filter === "All" || (item.status && item.status.toLowerCase() === filter.toLowerCase());
    return (item.user_name && item.user_name.toLowerCase().includes(searchTerm.toLowerCase())) && statusMatch;
  });

  const filteredGroupData = groupData.filter((group) =>{
    // const statusmatch = filter === "All" || (group.confirmed_cards.status && group.confirmed_cards.status.toLowerCase() === filter.toLowerCase());

    // const statusmatch=group.confirmed_cards.some((member) => filter === "All" || member.status.toLowerCase() === filter.toLowerCase())
      return (group.creator && group.creator.toLowerCase().includes(searchTerm.toLowerCase()));

});

  const totalPages = Math.max(1, Math.ceil((selectedTab === "individual" ? filteredIndividualData.length : filteredGroupData.length) / itemsPerPage));

  const paginatedIndividualData = filteredIndividualData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedGroupData = filteredGroupData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (cardId: string, imageUrl: string) => {
    setSelectedCard(imageUrl);
    setSelectedCardId(cardId);
    console.log(`Row clicked for card ID: ${cardId}`);
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      <div className="col-span-8 relative overflow-x-auto shadow-md sm:rounded-lg">
        <div className="flex flex-wrap items-center justify-between pb-4">
    
          <Tabs className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="individual" className={`text-lg font-semibold ${selectedTab === "individual" ? "bg-[#2ca8ff] text-white" : "bg-gray-300"}`} onClick={() => setSelectedTab("individual")}>Individual</TabsTrigger>
              <TabsTrigger value="group" className={`text-lg font-semibold  ${selectedTab === "group" ? "bg-[#2ca8ff] text-white" : "bg-gray-300"}`} onClick={() => setSelectedTab("group")}>Group</TabsTrigger>
            </TabsList>
          </Tabs>

          <input
            type="text"
            placeholder="Search for items"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded-lg w-64 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {error && <div className="text-red-500">{error}</div>}

        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : selectedTab === "individual" ? (
          <CustomTable className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <TableHeader className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Pickup Location</TableHead>
                <TableHead>Status</TableHead>
                {(filter !== "pending" && filter !== "rejected" && filter !== "printed") && (
                  <TableHead colSpan={2}>Action</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedIndividualData.map((card) => (
                <TableRow
                  key={card.card_id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    const imageUrl = card.image.startsWith("http")
                      ? card.image
                      : `${API_BASE_URL}${card.image}`;
                    console.log("Image URL:", imageUrl);
                    handleRowClick(card.card_id, imageUrl);
                  }}
                >
                  <TableCell>{card.user_name}</TableCell>
                  <TableCell>{card.account_number}</TableCell>
                  <TableCell>{card.pickup_location}</TableCell>
                  <TableCell>{card.status}</TableCell>
                  {(card.status !== "pending" && card.status !== "rejected" && card.status !== "printed") && (
                    <TableCell>
                      <button className="text-cyan-600" onClick={() => handleModal("print", card)}>Print</button>
                      <button className="text-red-700 ml-4" onClick={() => handleModal("reject", card)}>Reject</button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </CustomTable>
        ) : (
          <CustomTable className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <TableHeader className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <TableRow>
                <TableHead>Created By</TableHead>
                <TableHead>Members Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Account </TableHead>
                <TableHead>Status </TableHead>
                <TableHead>Action </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGroupData.map((group) =>
                group.confirmed_cards.map((member, index) => (
                  <TableRow
                    key={`${group.groupId}-${index}`}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleRowClick(member.card_id, `${API_BASE_URL}/media/${group.image}`)}
                  >
                    {index === 0 && (
                      <>
                        <TableCell rowSpan={group.confirmed_cards.length}>{group.creator}</TableCell>
                      </>
                    )}
                    <TableCell>{member.user_name}</TableCell>
                    <TableCell>{member.phone_number || "N/A"}</TableCell>
                    <TableCell>{member.account_number || "N/A"}</TableCell>
                    <TableCell>{member.status || "N/A"}</TableCell>
                    <TableCell>
                      <button className="text-cyan-600" onClick={() => handleModal("print", group)}>Print</button>
                      <button className="text-red-700 ml-4" onClick={() => handleModal("reject", group)}>Reject</button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </CustomTable>
        )}

<Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
        className="flex items-center justify-between pt-4"
      />
      </div>

      <div className="col-span-4 flex items-center justify-center bg-gray-100 p-4 rounded-lg shadow-md" style={{ height: "250px" }}>
        {selectedCard && <img src={selectedCard} alt="Selected Card" className="w-full h-auto rounded-lg shadow-lg" />}
      </div>
      {modalData.isOpen && (
        <Dialog open={modalData.isOpen} onOpenChange={closeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{modalData.action === "print" ? "Print Card" : "Reject Card"}</DialogTitle>
              <DialogDescription>
                Are you sure you want to {modalData.action} this card for {" "}
                {modalData.customer ? (
                  "card_id" in modalData.customer ? (
                    modalData.customer.user_name // For individual cards
                  ) : (
                    // For group cards, find the matching card using selectedCardId
                    modalData.customer.confirmed_cards.find((member:any) => member.card_id === selectedCardId)?.user_name || "unknown"
                  )
                ) : "unknown"}?
              </DialogDescription>

              {modalData.action === "reject" && (
                <Textarea 
                  placeholder="Enter rejection reason" 
                  value={rejectReason} 
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              )}
            </DialogHeader>
            <div className="flex justify-center gap-4 mt-4">
              <Button onClick={closeModal} className="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">Cancel</Button>

              <Button onClick={async () => {
                try {
                  const status = modalData.action === "print" ? "printed" : "rejected";
                  const payload: { id: string; status: string; reason?: string } = { id: selectedCardId!, status };
                  if (modalData.action === "print" && selectedCard) {
                    const response = await fetch(selectedCard);
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'card-image.jpg');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }

                  if (modalData.action === "reject") {
                    payload.reason = rejectReason;
                  }

                  console.log("Updating status for ID:", payload.id);
                  console.log("Payload:", payload);

                  await api.put(`/cards/confirmed-cards-update/${payload.id}`, payload);
                  closeModal();
                  window.location.reload();
                } catch (error) {
                  console.error("Failed to update status:", error);
                }
              }}>
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}  
    </div>
    
  );
};

export default CardTable;