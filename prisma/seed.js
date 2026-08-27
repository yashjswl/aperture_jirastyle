const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { PrismaClient } = require("../src/generated/prisma/client");

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_oLiTD9wCU6HA@ep-lively-hat-aew2n5c8.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function upsertUser(data) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      passwordHash,
      role: data.role,
      title: data.title,
      bio: data.bio,
    },
    create: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      title: data.title,
      bio: data.bio,
    },
  });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@apertureart.org";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2026";

  const admin = await upsertUser({
    name: "Aperture Webadmin",
    email: adminEmail,
    password: adminPassword,
    role: "WEBADMIN",
    title: "Web Administrator",
  });

  const core = await upsertUser({
    name: "Meera Iyer",
    email: "meera@apertureart.org",
    password: "CoreMember!123",
    role: "CORE_MEMBER",
    title: "Creative Director",
    bio: "Leads exhibition planning and the core committee.",
  });

  const team = await upsertUser({
    name: "Rohan Das",
    email: "rohan@apertureart.org",
    password: "TeamAperture!123",
    role: "TEAM_APERTURE",
    title: "Photography Team",
  });

  const working = await upsertUser({
    name: "Ananya Shah",
    email: "ananya@apertureart.org",
    password: "WorkingTeam!123",
    role: "WORKING_TEAM",
    title: "Working Member — Design",
  });

  const event = await prisma.event.upsert({
    where: { id: "seed-event-winter-expo" },
    update: {},
    create: {
      id: "seed-event-winter-expo",
      title: "Winter Digital Art Exhibition",
      description: "Annual showcase of member digital artwork across the campus gallery.",
      location: "Main Gallery",
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      status: "UPCOMING",
      createdById: admin.id,
      assignments: {
        create: [
          { userId: team.id, status: "SORT_AND_EDIT" },
          { userId: working.id, status: "ASSIGNED" },
        ],
      },
    },
  });

  await prisma.announcement.upsert({
    where: { id: "seed-announcement-welcome" },
    update: {},
    create: {
      id: "seed-announcement-welcome",
      title: "Welcome to the new Aperture portal",
      body: "This is the working members portal for Aperture — The Digital Arts Society. Use it to find fellow members, track events, and stay on top of announcements.",
      pinned: true,
      authorId: admin.id,
    },
  });

  console.log("Seed complete.");
  console.log(`Webadmin login: ${adminEmail} / ${adminPassword}`);
  console.log(`Sample event: ${event.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
