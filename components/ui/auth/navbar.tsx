"use client";
import Link from "next/link";
import {
  Cloud,
  CreditCard,
  Github,
  Keyboard,
  LifeBuoy,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  PlusCircle,
  Settings,
  User,
  UserPlus,
  Users,
  CircleUser,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, BellRing, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

// import { jwtDecode } from "jwt-decode";
// import { useRouter } from "next/navigation";
// import NewUser from "./add-user";
// import { Notification } from "./notification";

const Navbar = () => {


  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  return (
    <div>
   

        <nav className="fixed z-50 w-full bg-gray-100 dark:bg-gray-800 shadow-md h-16 flex items-center px-6 ">
        <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
        <Image 
        src="/1.png"  // Change to your logo filename
        alt="COOP Logo" 
        width={100}  // Adjust width
        height={50}  // Adjust height
        priority  // Faster loading
      />

        </Link>
        </div>
        <div className="px-3 py-2 lg:px-5 lg:pl-5">
          <div className="flex items-center justify-between">
         
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
