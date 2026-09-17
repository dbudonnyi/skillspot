import { PrismaClient, Prisma, Category, ProfileSource, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

type SeedReview = {
  name: string;
  rating: number;
  text: string;
  photo: boolean;
  daysAgo: number;
};
type SeedService = {
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  ageMin: number;
  ageMax: number;
};
type SeedProfile = {
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  booksy: string | null;
  minAge: number;
  maxAge: number;
  priceFrom: number;
  priceUnit: string;
  openingHours: unknown;
  verified: boolean;
  featured: boolean;
  source: string;
  osmId: string | null;
  services: SeedService[];
  reviews: SeedReview[];
};

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  console.log("Seeding SkillSpot…");
  const profiles = JSON.parse(
    readFileSync(join(process.cwd(), "prisma", "seed-data", "profiles.json"), "utf8")
  ) as SeedProfile[];
  const photoPlan = JSON.parse(
    readFileSync(
      join(process.cwd(), "prisma", "seed-data", "photo_plan.json"),
      "utf8"
    )
  ) as Record<string, string[]>;

  // idempotent: wipe content tables, keep nothing
  await prisma.notification.deleteMany();
  await prisma.bookingRequest.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.service.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.user.deleteMany();

  const pwHash = await bcrypt.hash("demo1234", 10);
  const rng = mulberry32(1337);

  // reviewer pool — real users so FKs are genuine
  const reviewerNames = new Set<string>();
  for (const p of profiles) for (const r of p.reviews) reviewerNames.add(r.name);
  const reviewers: { id: string; name: string }[] = [];
  let n = 0;
  for (const name of reviewerNames) {
    const email = `reviewer${n++}@users.skillspot.local`;
    const u = await prisma.user.create({
      data: { email, name, role: Role.USER, passwordHash: pwHash },
      select: { id: true, name: true },
    });
    reviewers.push(u);
  }
  console.log(`  ${reviewers.length} reviewer users`);

  let created = 0;
  let reviewCount = 0;
  for (const p of profiles) {
    const ownerEmail =
      p.slug === "warszaw-szachtar-pro-school"
        ? "demo@szachtar.pl"
        : `owner${created}@${p.slug.slice(0, 30)}.skillspot.local`;
    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        name: `${p.name} (owner)`,
        role: Role.PROVIDER,
        passwordHash: pwHash,
      },
    });

    const photos = photoPlan[p.slug] ?? [];
    const used = new Set<string>();
    const services = p.services.map((s) => ({
      title: s.title,
      description: s.description,
      price: s.price,
      priceUnit: s.priceUnit,
      ageMin: Math.min(s.ageMin, p.maxAge),
      ageMax: Math.max(s.ageMax, s.ageMin + 1),
    }));

    const profile = await prisma.providerProfile.create({
      data: {
        ownerId: owner.id,
        slug: p.slug,
        name: p.name,
        category: p.category as Category,
        subcategory: p.subcategory,
        description: p.description,
        address: p.address,
        district: p.district,
        lat: p.lat,
        lng: p.lng,
        phone: p.phone,
        email: p.email,
        website: p.website,
        instagram: p.instagram,
        facebook: p.facebook,
        booksy: p.booksy,
        minAge: p.minAge,
        maxAge: p.maxAge,
        priceFrom: p.priceFrom,
        priceUnit: p.priceUnit,
        openingHours: (p.openingHours ?? undefined) as Prisma.InputJsonValue,
        verified: p.verified,
        featured: p.featured,
        source: p.source as ProfileSource,
        osmId: p.osmId,
        coverImage: photos[0] ?? null,
        gallery: photos.slice(1),
        services: { create: services },
      },
    });

    // reviews — unique per (profile, user)
    const picked = reviewers
      .slice()
      .sort(() => rng() - 0.5)
      .slice(0, p.reviews.length);
    for (let i = 0; i < Math.min(p.reviews.length, picked.length); i++) {
      const r = p.reviews[i];
      const photosForReview =
        r.photo && photos.length > 1
          ? [photos[1 + Math.floor(rng() * (photos.length - 1))]]
          : [];
      await prisma.review.create({
        data: {
          profileId: profile.id,
          userId: picked[i].id,
          rating: r.rating,
          text: r.text,
          photos: photosForReview,
          createdAt: new Date(Date.now() - r.daysAgo * 86400_000),
        },
      });
      reviewCount++;
      void used;
    }
    created++;
  }
  console.log(`  ${created} profiles, ${reviewCount} reviews`);

  // demo parent + demo content
  const parent = await prisma.user.create({
    data: {
      email: "parent@demo.pl",
      name: "Anna Demo-Parent",
      role: Role.USER,
      passwordHash: pwHash,
    },
  });
  const szachtar = await prisma.providerProfile.findUniqueOrThrow({
    where: { slug: "warszaw-szachtar-pro-school" },
    include: { services: { take: 1 } },
  });
  const crocodile = await prisma.providerProfile.findUniqueOrThrow({
    where: { slug: "crocodile-swimming-school" },
  });
  await prisma.favorite.create({
    data: { userId: parent.id, profileId: szachtar.id },
  });
  await prisma.bookingRequest.create({
    data: {
      profileId: szachtar.id,
      userId: parent.id,
      serviceId: szachtar.services[0]?.id,
      message:
        "Dzień dobry! Mój 6-letni syn bardzo chce grać w piłkę. Czy są wolne miejsca w grupie Start i kiedy można przyjść na trening próbny?",
      contactEmail: parent.email,
      contactPhone: "+48 600 100 200",
    },
  });
  await prisma.bookingRequest.create({
    data: {
      profileId: crocodile.id,
      userId: parent.id,
      message:
        "Hello! Looking for learn-to-swim for our 5-year-old daughter (complete beginner, a bit scared of water). Which group fits and what's the waiting list like?",
      contactEmail: parent.email,
    },
  });
  await prisma.notification.create({
    data: {
      userId: szachtar.ownerId,
      type: "NEW_REQUEST",
      title: "New booking request",
      body: "Anna Demo-Parent wants to join Kids football 4–7 “Start”",
      link: "/dashboard/requests",
    },
  });
  console.log("  demo accounts & requests ready");

  // recompute all ratings
  for (const p of await prisma.providerProfile.findMany({ select: { id: true } })) {
    const agg = await prisma.review.aggregate({
      where: { profileId: p.id },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.providerProfile.update({
      where: { id: p.id },
      data: {
        ratingAvg: Math.round((agg._avg.rating ?? 0) * 100) / 100,
        ratingCount: agg._count,
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    profiles: await prisma.providerProfile.count(),
    services: await prisma.service.count(),
    reviews: await prisma.review.count(),
  };
  console.log("DONE", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
