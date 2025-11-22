import { createContext } from "react";

interface Teacher {
  _id: string;
  idTeacher: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClassInfo {
  _id: string;
  name: string;
  idClass: string;
  point: number;
  students: string[];
  teacher: Teacher;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  idStudent: string;
  class: ClassInfo;
}

export interface AppContextType {
  ping: string;
  setPing: React.Dispatch<React.SetStateAction<string>>;
  location: "dashboard" | "student" | "classe" | "role" | "user";
  setLocation: React.Dispatch<
    React.SetStateAction<"dashboard" | "student" | "classe" | "role" | "user">
  >;
  openAddStudentForm: boolean;
  setOpenAddStudentForm: React.Dispatch<React.SetStateAction<boolean>>;
  reRenderTableStudent: boolean;
  setReRenderTableStudent: React.Dispatch<React.SetStateAction<boolean>>;
  openModifyStudentForm: boolean;
  setOpenModifyStudentForm: React.Dispatch<React.SetStateAction<boolean>>;
  currentStudent: Student | null;
  setCurrentStudent: React.Dispatch<React.SetStateAction<Student | null>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modal: any;
  contextHolder: React.ReactNode;
  openAddRoleForm: boolean;
  setOpenAddRoleForm: React.Dispatch<React.SetStateAction<boolean>>;
  reRenderRuleTable: boolean;
  setReRenderRuleTable: React.Dispatch<React.SetStateAction<boolean>>;
  openModifyRoleForm: boolean;
  setOpenModifyRoleForm: React.Dispatch<React.SetStateAction<boolean>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentRole: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCurrentRole: React.Dispatch<React.SetStateAction<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageApi: any;
  contextHolderMess: React.ReactNode;
  openAddRecordForm: boolean;
  setOpenAddRecordForm: React.Dispatch<React.SetStateAction<boolean>>;
  reRenderTableRecord: boolean;
  setReRenderTableRecord: React.Dispatch<React.SetStateAction<boolean>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentRecordForm: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCurrentRecordForm: React.Dispatch<React.SetStateAction<any>>;
  openModifyRecordForm: boolean;
  setOpenModifyRecordForm: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
