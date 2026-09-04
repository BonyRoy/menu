import { Navigate } from "react-router-dom";
import { getAdminSession } from "../lib/adminSession";

export default function AdminGate({ children }) {
  if (!getAdminSession()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
