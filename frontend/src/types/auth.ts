export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: "ROLE_USER" | "ROLE_ADMIN";
};
export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & { displayName: string };
