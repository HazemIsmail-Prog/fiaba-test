import type { Role } from "@prisma/client";

export type AuthPayload = {
  userId: number;
  role: Role;
};
