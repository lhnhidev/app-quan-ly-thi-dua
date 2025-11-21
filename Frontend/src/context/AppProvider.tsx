import { message, Modal } from "antd";
import { AppContext } from "./AppContext";
import { useState, type ReactNode } from "react";

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

const AppProvider = ({ children }: { children: ReactNode }) => {
  const [ping, setPing] = useState<string>("Hello from app context!");
  const [location, setLocation] = useState<
    "dashboard" | "student" | "classe" | "role" | "user"
  >("dashboard");

  const [openAddStudentForm, setOpenAddStudentForm] = useState<boolean>(false);
  const [reRenderTableStudent, setReRenderTableStudent] =
    useState<boolean>(false);
  const [openModifyStudentForm, setOpenModifyStudentForm] =
    useState<boolean>(false);

  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const [openAddRoleForm, setOpenAddRoleForm] = useState(false);
  const [reRenderRuleTable, setReRenderRuleTable] = useState(false);
  const [openModifyRoleForm, setOpenModifyRoleForm] = useState(false);

  const [messageApi, contextHolderMess] = message.useMessage();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentRole, setCurrentRole] = useState<any>(null);

  return (
    <AppContext.Provider
      value={{
        ping,
        setPing,
        location,
        setLocation,
        openAddStudentForm,
        setOpenAddStudentForm,
        reRenderTableStudent,
        setReRenderTableStudent,
        openModifyStudentForm,
        setOpenModifyStudentForm,
        currentStudent,
        setCurrentStudent,
        modal,
        contextHolder,
        openAddRoleForm,
        setOpenAddRoleForm,
        reRenderRuleTable,
        setReRenderRuleTable,
        openModifyRoleForm,
        setOpenModifyRoleForm,
        currentRole,
        setCurrentRole,
        messageApi,
        contextHolderMess,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
export default AppProvider;
