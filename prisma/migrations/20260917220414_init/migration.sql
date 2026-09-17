-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'PROVIDER');

-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('NEW', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('FOOTBALL', 'SWIMMING', 'BASKETBALL', 'VOLLEYBALL', 'TENNIS', 'MARTIAL_ARTS', 'GYMNASTICS', 'DANCE', 'MUSIC', 'ART', 'CHESS', 'LANGUAGES', 'ROBOTICS', 'SKATING', 'HORSE_RIDING', 'ATHLETICS', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ProfileSource" AS ENUM ('MANUAL', 'OSM', 'MOCK');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderProfile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "public"."Category" NOT NULL,
    "subcategory" TEXT,
    "source" "public"."ProfileSource" NOT NULL DEFAULT 'MANUAL',
    "osmId" TEXT,
    "description" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "booksy" TEXT,
    "address" TEXT NOT NULL,
    "district" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "minAge" INTEGER NOT NULL DEFAULT 3,
    "maxAge" INTEGER NOT NULL DEFAULT 99,
    "priceFrom" INTEGER,
    "priceUnit" TEXT NOT NULL DEFAULT 'per lesson',
    "coverImage" TEXT,
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openingHours" JSONB,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "priceUnit" TEXT NOT NULL DEFAULT 'per lesson',
    "ageMin" INTEGER NOT NULL DEFAULT 3,
    "ageMax" INTEGER NOT NULL DEFAULT 99,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingRequest" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT,
    "message" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_ownerId_key" ON "public"."ProviderProfile"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_slug_key" ON "public"."ProviderProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_osmId_key" ON "public"."ProviderProfile"("osmId");

-- CreateIndex
CREATE INDEX "ProviderProfile_category_ratingCount_idx" ON "public"."ProviderProfile"("category", "ratingCount" DESC);

-- CreateIndex
CREATE INDEX "ProviderProfile_ratingAvg_ratingCount_idx" ON "public"."ProviderProfile"("ratingAvg", "ratingCount" DESC);

-- CreateIndex
CREATE INDEX "ProviderProfile_district_idx" ON "public"."ProviderProfile"("district");

-- CreateIndex
CREATE INDEX "Service_profileId_idx" ON "public"."Service"("profileId");

-- CreateIndex
CREATE INDEX "Review_profileId_idx" ON "public"."Review"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_profileId_userId_key" ON "public"."Review"("profileId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_profileId_key" ON "public"."Favorite"("userId", "profileId");

-- CreateIndex
CREATE INDEX "BookingRequest_profileId_status_idx" ON "public"."BookingRequest"("profileId", "status");

-- CreateIndex
CREATE INDEX "BookingRequest_userId_idx" ON "public"."BookingRequest"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "public"."Notification"("userId", "read");

-- AddForeignKey
ALTER TABLE "public"."ProviderProfile" ADD CONSTRAINT "ProviderProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingRequest" ADD CONSTRAINT "BookingRequest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingRequest" ADD CONSTRAINT "BookingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingRequest" ADD CONSTRAINT "BookingRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
