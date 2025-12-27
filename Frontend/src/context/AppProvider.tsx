import { message, Modal } from "antd";
import { AppContext } from "./AppContext";
import { useState, type ReactNode } from "react";
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

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  idStudent: string;
  class: ClassInfo;
}

interface User {
  _id: string;
  idUser: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
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

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [openAddRoleForm, setOpenAddRoleForm] = useState(false);
  const [reRenderRuleTable, setReRenderRuleTable] = useState(false);
  const [openModifyRoleForm, setOpenModifyRoleForm] = useState(false);

  const [messageApi, contextHolderMess] = message.useMessage();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentRole, setCurrentRole] = useState<any>(null);

  const [openAddRecordForm, setOpenAddRecordForm] = useState<boolean>(false);
  const [reRenderTableRecord, setReRenderTableRecord] =
    useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentRecordForm, setCurrentRecordForm] = useState<any>(null);
  const [openModifyRecordForm, setOpenModifyRecordForm] =
    useState<boolean>(false);

  const [openAddClassForm, setOpenAddClassForm] = useState<boolean>(false);
  const [reRenderTableClass, setReRenderTableClass] = useState<boolean>(false);

  const [openAddTeacherForm, setOpenAddTeacherForm] = useState<boolean>(false);
  const [reRenderTableTeacher, setReRenderTableTeacher] =
    useState<boolean>(false);

  const [openAddUserForm, setOpenAddUserForm] = useState<boolean>(false);
  const [reRenderTableUser, setReRenderTableUser] = useState<boolean>(false);

  const [openModifyUserForm, setOpenModifyUserForm] = useState<boolean>(false);

  const [reRenderClassTable, setReRenderClassTable] = useState<boolean>(false);

  const [currentClass, setCurrentClass] = useState<ClassInfo2 | null>(null);

  const [openModifyClassForm, setOpenModifyClassForm] =
    useState<boolean>(false);

  const [currentTeacher, setCurrentTeacher] = useState<TeacherData | null>(
    null,
  );
  const [openModifyTeacherForm, setOpenModifyTeacherForm] =
    useState<boolean>(false);

  const [showResponseModal, setShowResponseModal] = useState(false);

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
        openAddRecordForm,
        setOpenAddRecordForm,
        reRenderTableRecord,
        setReRenderTableRecord,
        currentRecordForm,
        setCurrentRecordForm,
        openModifyRecordForm,
        setOpenModifyRecordForm,
        openAddClassForm,
        setOpenAddClassForm,
        reRenderTableClass,
        setReRenderTableClass,
        openAddTeacherForm,
        setOpenAddTeacherForm,
        reRenderTableTeacher,
        setReRenderTableTeacher,
        openAddUserForm,
        setOpenAddUserForm,
        reRenderTableUser,
        setReRenderTableUser,
        currentUser,
        setCurrentUser,
        openModifyUserForm,
        setOpenModifyUserForm,
        reRenderClassTable,
        setReRenderClassTable,
        currentClass,
        setCurrentClass,
        openModifyClassForm,
        setOpenModifyClassForm,
        currentTeacher,
        setCurrentTeacher,
        openModifyTeacherForm,
        setOpenModifyTeacherForm,
        showResponseModal,
        setShowResponseModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
export default AppProvider;
