const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_oLiTD9wCU6HA@ep-lively-hat-aew2n5c8.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function seed() {
  const adminPass = await bcrypt.hash("ChangeMe!2026", 12);
  const meeraPass = await bcrypt.hash("CoreMember!123", 12);
  const rohanPass = await bcrypt.hash("TeamAperture!123", 12);
  const ananyaPass = await bcrypt.hash("WorkingTeam!123", 12);

  await pool.query(`
    INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "title", "bio", "isActive", "createdAt", "updatedAt")
    VALUES 
      ('seed-admin', 'Aperture Webadmin', 'admin@apertureart.org', '${adminPass}', 'WEBADMIN', 'Web Administrator', NULL, true, NOW(), NOW()),
      ('seed-meera', 'Meera Iyer', 'meera@apertureart.org', '${meeraPass}', 'CORE_MEMBER', 'Creative Director', 'Leads exhibition planning and the core committee.', true, NOW(), NOW()),
      ('seed-rohan', 'Rohan Das', 'rohan@apertureart.org', '${rohanPass}', 'TEAM_APERTURE', 'Photography Team', NULL, true, NOW(), NOW()),
      ('seed-ananya', 'Ananya Shah', 'ananya@apertureart.org', '${ananyaPass}', 'WORKING_TEAM', 'Working Member — Design', NULL, true, NOW(), NOW())
    ON CONFLICT ("email") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "role" = EXCLUDED."role";
  `);

  console.log("Direct PG seed successful!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
