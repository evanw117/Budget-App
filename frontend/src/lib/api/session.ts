export const cookieName = "waymark_session";
export const noCache = { "Cache-Control": "no-store" };
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
