import { AppContext } from "./AppContext";
import { useState, type ReactNode } from "react";

const AppProvider = ({ children }: { children: ReactNode }) => {
  const [ping, setPing] = useState<string>("Hello from app context!");
  const [location, setLocation] = useState<
    "dashboard" | "student" | "classe" | "role" | "user"
  >("dashboard");

  return (
    <AppContext.Provider
      value={{
        ping,
        setPing,
        location,
        setLocation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
export default AppProvider;
