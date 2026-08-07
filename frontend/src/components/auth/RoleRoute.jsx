import { Navigate } from "react-router-dom";
import { getDashboardPath } from "../../utils/auth";

const RoleRoute = ({ allowedRole, children }) => {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    user = null;
  }

  /*
   * User logged in না হলে login page
   */
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  /*
   * Correct role হলে requested page show করবে
   */
  if (user.role === allowedRole) {
    return children;
  }

  /*
   * Wrong role দিয়ে অন্য dashboard access করলে
   * নিজের dashboard-এ পাঠিয়ে দিবে
   */
  return (
    <Navigate
      to={getDashboardPath(user.role)}
      replace
    />
  );
};

export default RoleRoute;