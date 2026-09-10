import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "RESPONDENT" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role: "RESPONDENT" | "ADMIN";
  }
}
