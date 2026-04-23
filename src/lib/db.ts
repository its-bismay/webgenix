import { PrismaClient } from "@/generated/prisma/client";
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon"


const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaNeon({
  connectionString,
});

export const db = new PrismaClient({
  adapter,
});
