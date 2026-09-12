import "dotenv/config";
import { prisma } from "./lib/prisma";

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "demo@intellispend.local",
    },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@intellispend.local",
    },
  });

  console.log("✅ Demo user ready!");
  console.log("User ID:", user.id);
}

main()
  .catch((error) => {
    console.error("❌ Failed to create demo user:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });