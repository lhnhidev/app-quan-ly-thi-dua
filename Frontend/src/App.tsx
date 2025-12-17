import AddClassForm from "./components/Form/AddClassForm";
import AddRecordForm from "./components/Form/AddRecordForm";
import AddRoleForm from "./components/Form/AddRoleForm";
import AddStudentsForm from "./components/Form/AddStudentsForm";
import AddTeacherForm from "./components/Form/AddTeacherForm";
import AddUserForm from "./components/Form/AddUserForm";
import ModifyRecordForm from "./components/Form/ModifyRecordForm";
import ModifyRoleForm from "./components/Form/ModifyRoleForm";
import ModifyStudentForm from "./components/Form/ModifyStudentForm";
import ModifyUserForm from "./components/Form/ModifyUserForm";
import { useAppContext } from "./context";
import AppRoutes from "./router";

const App = () => {
  const { contextHolder, contextHolderMess } = useAppContext();

  return (
    <div>
      <AppRoutes />
      <AddStudentsForm></AddStudentsForm>
      <ModifyStudentForm></ModifyStudentForm>
      <AddRoleForm></AddRoleForm>
      <ModifyRoleForm></ModifyRoleForm>
      <AddRecordForm></AddRecordForm>
      <ModifyRecordForm></ModifyRecordForm>
      <AddClassForm></AddClassForm>
      <AddTeacherForm></AddTeacherForm>
      <AddUserForm></AddUserForm>
      <ModifyUserForm></ModifyUserForm>
      {contextHolder}
      {contextHolderMess}
    </div>
  );
};
export default App;
