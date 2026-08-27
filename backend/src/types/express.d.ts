import type { Client } from "@prisma/client";
import type { AuthPayload } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      user: AuthPayload;
      client: Client;
    }
  }
}

export {};
