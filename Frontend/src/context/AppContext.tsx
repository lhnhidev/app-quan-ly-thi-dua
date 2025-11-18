import { createContext } from "react";

export interface AppContextType {
  ping: string;
  setPing: React.Dispatch<React.SetStateAction<string>>;
  location: "dashboard" | "student" | "classe" | "role" | "user";
  setLocation: React.Dispatch<
    React.SetStateAction<"dashboard" | "student" | "classe" | "role" | "user">
  >;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
