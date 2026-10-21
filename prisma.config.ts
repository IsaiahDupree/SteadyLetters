import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Client generation does not connect to the database. Keep preview builds
    // independent of production database credentials; DB commands still need
    // DATABASE_URL at execution time.
    url: process.env.DATABASE_URL ?? "",
  },
});
