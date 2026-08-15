export const getDashboardPath = (role) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";

    case "vendor":
      return "/vendor/dashboard";

    case "customer":
      return "/auth";

    default:
      return "/";
  }
};