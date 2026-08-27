import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type Prisma } from "@prisma/client";
import { defaultWebsiteSections } from "../src/defaultWebsite.js";

const prisma = new PrismaClient();

const defaultSections = defaultWebsiteSections as Prisma.InputJsonValue;

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    throw new Error("Refusing to seed in production. Local demo only, or set ALLOW_SEED=true.");
  }

  const passwordHash = await bcrypt.hash("fiaba123", 10);

  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.meetingItem.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.event.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.websiteContent.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        email: "admin@fiaba.local",
        passwordHash,
        role: "admin",
        name: "FIABA Admin",
      },
      {
        email: "manager@fiaba.local",
        passwordHash,
        role: "manager",
        name: "Maya Rossi",
      },
      {
        email: "accountant@fiaba.local",
        passwordHash,
        role: "accountant",
        name: "Omar Haddad",
      },
      {
        email: "secretary@fiaba.local",
        passwordHash,
        role: "secretary",
        name: "Lina Farah",
      },
    ],
  });

  const clientUser = await prisma.user.create({
    data: {
      email: "client@fiaba.local",
      passwordHash,
      role: "client",
      name: "Elena Moretti",
      client: {
        create: {
          phone: "+39 333 000 1111",
          address: "Via Roma 12, Milano",
          notes: "Prefers evening meetings. Floral palette: ivory and sage.",
        },
      },
    },
    include: { client: true },
  });

  const event = await prisma.event.create({
    data: {
      clientId: clientUser.client!.id,
      title: "Moretti Wedding",
      type: "wedding",
      status: "planning",
      location: "Villa Balbiano, Lake Como",
      eventDate: new Date("2026-09-12T16:00:00.000Z"),
    },
  });

  const contract = await prisma.contract.create({
    data: {
      eventId: event.id,
      contractNumber: "CON-2026-0001",
      status: "signed",
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      contractId: contract.id,
      invoiceNumber: "INV-2026-0001",
      amount: 12000,
      paidAmount: 4000,
      status: "partial",
      invoiceDateTime: new Date("2026-03-01T10:00:00.000Z"),
      invoiceDueDate: new Date("2026-08-01T10:00:00.000Z"),
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      paymentNumber: "PAY-2026-0001",
      amount: 4000,
      method: "bank_transfer",
      paymentDateTime: new Date("2026-03-15T12:00:00.000Z"),
    },
  });

  const meeting = await prisma.meeting.create({
    data: {
      eventId: event.id,
      scheduledAt: new Date("2026-04-20T15:00:00.000Z"),
      status: "completed",
    },
  });

  await prisma.meetingItem.createMany({
    data: [
      {
        meetingId: meeting.id,
        name: "Ceremony florals",
        category: "flowers",
        status: "approved",
        notes:
          "Aisle: low ivory garden roses with sage eucalyptus.\nAltar: two tall arrangements, no trailing greenery on the floor.\nBoutonnieres: one white spray rose each for the groomsmen.",
      },
      {
        meetingId: meeting.id,
        name: "Table linens & candles",
        category: "materials",
        status: "pending",
        notes:
          "Stone-washed ivory linen, no overlay.\nTaper candles in aged brass, unscented.\nClient asked to avoid pink entirely.",
      },
      {
        meetingId: meeting.id,
        name: "Welcome drinks styling",
        category: "extra",
        status: "in_progress",
        notes:
          "Sparkling water station with citrus and herbs.\nSignage in the same serif as the invitations.",
      },
    ],
  });

  await prisma.appointment.create({
    data: {
      clientId: clientUser.client!.id,
      guestName: "Elena Moretti",
      guestEmail: "client@fiaba.local",
      guestPhone: "+39 333 000 1111",
      message: "Follow-up to review cake tasting and seating chart.",
      requestedAt: new Date("2026-05-10T14:00:00.000Z"),
      status: "scheduled",
    },
  });

  await prisma.appointment.create({
    data: {
      guestName: "Giulia Bianchi",
      guestEmail: "giulia@example.com",
      guestPhone: "+39 340 222 3333",
      message: "Looking for a small autumn wedding for about 80 guests.",
      requestedAt: new Date("2026-06-02T11:00:00.000Z"),
      status: "pending",
    },
  });

  await prisma.websiteContent.create({
    data: { sections: defaultSections },
  });

  console.log("Seeded FIABA database.");
  console.log("Logins (password: fiaba123):");
  console.log("  admin@fiaba.local");
  console.log("  manager@fiaba.local");
  console.log("  accountant@fiaba.local");
  console.log("  secretary@fiaba.local");
  console.log("  client@fiaba.local");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
