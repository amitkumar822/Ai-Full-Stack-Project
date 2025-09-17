import { UserDetailsType } from "@/provider";
import { createContext } from "react";

type UserDetailsContextType = {
  userDetails: UserDetailsType | undefined;
  setUserDetails: (userDetails: UserDetailsType | undefined) => void;
};

export const UserDetailsContext = createContext<
  UserDetailsContextType | undefined
>(undefined);
