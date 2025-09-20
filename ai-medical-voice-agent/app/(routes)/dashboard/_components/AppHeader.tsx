import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const menuOptions = [
  {
    id: 1,
    label: "Home",
    href: "/",
  },
  {
    id: 2,
    label: "History",
    href: "/dashboard/history",
  },
  {
    id: 3,
    label: "Pricing",
    href: "/dashboard/billing",
  },
  {
    id: 4,
    label: "Profile",
    href: "/profile",
  },
];

function AppHeader() {
  return (
    <div className="flex items-center justify-between p-4 shadow px-10 md:px-20 lg:px-40">
      <Image src="/logo.svg" alt="logo" width={180} height={90} />
      <div className="hidden md:flex items-center gap-12">
        {menuOptions.map((option) => (
          <Link key={option.id} href={option.href}>
            <h2 className="hover:font-bold cursor-pointer transition-all">{option.label}</h2>
          </Link>
        ))}
      </div>
      <UserButton />
    </div>
  );
}

export default AppHeader;
