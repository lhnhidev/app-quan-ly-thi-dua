import AddRoleForm from "./components/Form/AddRoleForm";
import AddStudentsForm from "./components/Form/AddStudentsForm";
import ModifyRoleForm from "./components/Form/ModifyRoleForm";
import ModifyStudentForm from "./components/Form/ModifyStudentForm";
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
      {contextHolder}
      {contextHolderMess}
    </div>
  );
};
export default App;
