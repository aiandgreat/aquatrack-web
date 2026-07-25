import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const lastComplaint = await prisma.complaint.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rawText: true,
      aiStatus: true,
      category: true,
      urgency: true,
      summary: true,
      translatedText: true
    }
  });

  console.log("COMPLAINT AI DETAILS:");
  console.log(JSON.stringify(lastComplaint, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
