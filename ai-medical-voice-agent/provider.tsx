"use client";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { UserDetailsContext } from "./context/UserDetailsContext";

export type UserDetailsType = {
  name: string;
  email: string;
  credit: number;
};

function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useUser();
  const [userDetails, setUserDetails] = useState<UserDetailsType | undefined>(
    undefined
  );
  useEffect(() => {
    user && createUser();
  }, [user]);

  const createUser = async () => {
    try {
      const result = await axios.post("/api/user");
      console.log("User created", result?.data);
      setUserDetails(result?.data);
    } catch (error) {
      console.log("Error creating user", error);
    }
  };
  return (
    <div>
      <UserDetailsContext.Provider value={{ userDetails, setUserDetails }}>
        {children}
      </UserDetailsContext.Provider>
    </div>
  );
}

export default Provider;
