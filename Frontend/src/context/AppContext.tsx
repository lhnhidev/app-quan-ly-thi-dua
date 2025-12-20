import { createContext } from "react";
import type { TeacherData } from "../components/Table/TableTeacher";

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

interface ClassInfo2 {
  realId: string;
  displayId: string;
  name: string;
  grade: number;
  teacher: string;
  idTeacher: string;
  studentCount: number;
  logo: string;
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
  openAddClassForm: boolean;
  setOpenAddClassForm: React.Dispatch<React.SetStateAction<boolean>>;
  reRenderTableClass: boolean;
  setReRenderTableClass: React.Dispatch<React.SetStateAction<boolean>>;
  openAddTeacherForm: boolean;
  setOpenAddTeacherForm: React.Dispatch<React.SetStateAction<boolean>>;
  reRenderTableTeacher: boolean;
  setReRenderTableTeacher: React.Dispatch<React.SetStateAction<boolean>>;
  openAddUserForm: boolean;
  setOpenAddUserForm: React.Dispatch<React.SetStateAction<boolean>>;
  reRenderTableUser: boolean;
  setReRenderTableUser: React.Dispatch<React.SetStateAction<boolean>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentUser: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  openModifyUserForm: boolean;
  setOpenModifyUserForm: React.Dispatch<React.SetStateAction<boolean>>;
  reRenderClassTable: boolean;
  setReRenderClassTable: React.Dispatch<React.SetStateAction<boolean>>;
  currentClass: ClassInfo2 | null;
  setCurrentClass: React.Dispatch<React.SetStateAction<ClassInfo2 | null>>;
  openModifyClassForm: boolean;
  setOpenModifyClassForm: React.Dispatch<React.SetStateAction<boolean>>;
  currentTeacher: TeacherData | null;
  setCurrentTeacher: React.Dispatch<React.SetStateAction<TeacherData | null>>;
  openModifyTeacherForm: boolean;
  setOpenModifyTeacherForm: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
