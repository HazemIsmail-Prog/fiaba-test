import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

export async function bootstrapAdmin() {
  const existing = await prisma.user.count();
  if (existing > 0) return;

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Admin";

  if (!email || !password) {
    console.warn(
      "No users in the database. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create the first admin."
    );
    return;
  }
  if (password.length < 10) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 10 characters");
  }

  await prisma.user.create({
    data: {
      email,
      name,
      role: "admin",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  console.log(`Created bootstrap admin ${email}`);
}
