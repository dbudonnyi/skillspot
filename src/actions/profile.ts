"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireProvider, requireUser } from "@/lib/auth";
import { nearestDistrict } from "@/lib/geo";
import { sendEmail, newRequestEmail } from "@/lib/email";
import { savePhotoDataUrl, recomputeRating } from "@/lib/uploads";

const MAX_PHOTOS = 6;

export type ActionResult = { ok: boolean; error?: string };

/* ------------------------------- Favorites ------------------------------- */

export async function toggleFavoriteAction(profileId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const existing = await prisma.favorite.findUnique({
      where: { userId_profileId: { userId: user.id, profileId } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
    } else {
      const profile = await prisma.providerProfile.findUnique({ where: { id: profileId } });
      if (!profile) return { ok: false, error: "Profile not found." };
      await prisma.favorite.create({ data: { userId: user.id, profileId } });
    }
    revalidatePath(`/provider/${profileId}`, "page");
    revalidatePath("/favorites");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg === "UNAUTHORIZED" ? "Sign in to save favorites." : "Something went wrong." };
  }
}

/* -------------------------------- Reviews -------------------------------- */

const reviewSchema = z.object({
  profileId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(10, "Review should be at least 10 characters.").max(4000),
});

export async function submitReviewAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Please sign in to leave a review." };
  }
  const parsed = reviewSchema.safeParse({
    profileId: formData.get("profileId"),
    rating: formData.get("rating"),
    text: formData.get("text"),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid review." };

  const profile = await prisma.providerProfile.findUnique({
    where: { id: parsed.data.profileId },
  });
  if (!profile) return { ok: false, error: "Profile not found." };
  if (profile.ownerId === user.id)
    return { ok: false, error: "You cannot review your own profile." };

  const photosRaw = formData.get("photos");
  const photos: string[] = [];
  if (typeof photosRaw === "string" && photosRaw) {
    try {
      const arr = JSON.parse(photosRaw);
      if (Array.isArray(arr)) {
        for (const d of arr.slice(0, MAX_PHOTOS)) {
          if (typeof d === "string") {
            const p = await savePhotoDataUrl(d);
            if (p) photos.push(p);
          }
        }
      }
    } catch {
      /* ignore malformed photos payload */
    }
  }

  try {
    await prisma.review.create({
      data: {
        profileId: profile.id,
        userId: user.id,
        rating: parsed.data.rating,
        text: parsed.data.text,
        photos,
      },
    });
  } catch {
    return { ok: false, error: "You have already reviewed this profile." };
  }

  await recomputeRating(profile.id);
  await prisma.notification.create({
    data: {
      userId: profile.ownerId,
      type: "NEW_REVIEW",
      title: "New review",
      body: `${parsed.data.rating}★ review on ${profile.name}`,
      link: `/provider/${profile.slug}`,
    },
  });
  revalidatePath(`/provider/${profile.slug}`);
  return { ok: true };
}

/* ---------------------------- Booking requests ---------------------------- */

const requestSchema = z.object({
  profileId: z.string().min(1),
  serviceId: z.string().optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(2000),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(30).optional().or(z.literal("")),
});

export async function submitBookingRequestAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Please sign in to send a request." };
  }
  const parsed = requestSchema.safeParse({
    profileId: formData.get("profileId"),
    serviceId: String(formData.get("serviceId") || ""),
    message: formData.get("message"),
    contactEmail: String(formData.get("contactEmail") || user.email),
    contactPhone: String(formData.get("contactPhone") || ""),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid request." };

  const profile = await prisma.providerProfile.findUnique({
    where: { id: parsed.data.profileId },
    include: { services: { select: { id: true, title: true } } },
  });
  if (!profile) return { ok: false, error: "Profile not found." };
  if (profile.ownerId === user.id)
    return { ok: false, error: "This is your own profile." };

  const serviceId =
    parsed.data.serviceId &&
    profile.services.some((s) => s.id === parsed.data.serviceId)
      ? parsed.data.serviceId
      : null;
  const serviceTitle = profile.services.find((s) => s.id === serviceId)?.title ?? null;

  await prisma.bookingRequest.create({
    data: {
      profileId: profile.id,
      userId: user.id,
      serviceId,
      message: parsed.data.message,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone || null,
    },
  });

  await prisma.notification.create({
    data: {
      userId: profile.ownerId,
      type: "NEW_REQUEST",
      title: "New booking request",
      body: `${user.name} wants to join ${serviceTitle ?? profile.name}`,
      link: "/dashboard/requests",
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8080";
  const mail = newRequestEmail({
    providerName: profile.name,
    requesterName: user.name,
    requesterEmail: parsed.data.contactEmail,
    requesterPhone: parsed.data.contactPhone || null,
    serviceTitle,
    message: parsed.data.message,
    dashboardUrl: `${base}/dashboard/requests`,
  });
  const recipient =
    profile.email ||
    (await prisma.user.findUnique({
      where: { id: profile.ownerId },
      select: { email: true },
    }))?.email;
  if (recipient) void sendEmail({ to: recipient, ...mail }).catch(() => {});

  revalidatePath("/dashboard/requests");
  return { ok: true };
}

export async function setRequestStatusAction(
  requestId: string,
  status: "ACCEPTED" | "DECLINED"
): Promise<ActionResult> {
  try {
    const provider = await requireProvider();
    const req = await prisma.bookingRequest.findUnique({
      where: { id: requestId },
      include: { profile: { select: { ownerId: true, slug: true, name: true } } },
    });
    if (!req || req.profile.ownerId !== provider.id)
      return { ok: false, error: "Not found." };

    await prisma.bookingRequest.update({ where: { id: requestId }, data: { status } });
    await prisma.notification.create({
      data: {
        userId: req.userId,
        type: "REQUEST_STATUS",
        title: `Request ${status.toLowerCase()}`,
        body: `${req.profile.name} ${status.toLowerCase()} your request`,
        link: "/my-requests",
      },
    });
    revalidatePath("/dashboard/requests");
    return { ok: true };
  } catch {
    return { ok: false, error: "Not authorized." };
  }
}

/* ----------------------------- Provider profile ---------------------------- */

const providerEditSchema = z.object({
  profileId: z.string().min(1),
  name: z.string().min(2).max(120),
  category: z.string().min(2),
  subcategory: z.string().max(120).optional().or(z.literal("")),
  description: z.string().min(20, "Description should be at least 20 characters.").max(5000),
  address: z.string().min(3).max(200),
  lat: z.coerce.number().min(52.0).max(52.5),
  lng: z.coerce.number().min(20.8).max(21.3),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().max(300).optional().or(z.literal("")),
  instagram: z.string().max(300).optional().or(z.literal("")),
  facebook: z.string().max(300).optional().or(z.literal("")),
  booksy: z.string().max(300).optional().or(z.literal("")),
  minAge: z.coerce.number().int().min(0).max(18).default(3),
  maxAge: z.coerce.number().int().min(3).max(99).default(99),
  priceFrom: z.coerce.number().int().min(0).max(100000).optional(),
  priceUnit: z.string().max(40).optional().or(z.literal("")),
  coverImage: z.string().max(500).optional().or(z.literal("")),
});

export async function updateProviderProfileAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let provider;
  try {
    provider = await requireProvider();
  } catch {
    return { ok: false, error: "Provider sign-in required." };
  }
  const parsed = providerEditSchema.safeParse({
    profileId: formData.get("profileId"),
    name: formData.get("name"),
    category: formData.get("category"),
    subcategory: String(formData.get("subcategory") || ""),
    description: formData.get("description"),
    address: formData.get("address"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    website: String(formData.get("website") || ""),
    instagram: String(formData.get("instagram") || ""),
    facebook: String(formData.get("facebook") || ""),
    booksy: String(formData.get("booksy") || ""),
    minAge: formData.get("minAge") ?? 3,
    maxAge: formData.get("maxAge") ?? 99,
    priceFrom: formData.get("priceFrom") || undefined,
    priceUnit: String(formData.get("priceUnit") || ""),
    coverImage: String(formData.get("coverImage") || ""),
  });
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Invalid data.",
    };
  const d = parsed.data;
  if (provider.providerProfile?.id !== d.profileId)
    return { ok: false, error: "Not authorized for this profile." };
  if (d.maxAge < d.minAge) return { ok: false, error: "Max age must be ≥ min age." };

  let cover = d.coverImage || null;
  const newCover = formData.get("coverImageFile");
  if (typeof newCover === "string" && newCover.startsWith("data:image")) {
    const saved = await savePhotoDataUrl(newCover);
    if (saved) cover = saved;
  }

  const galleryAdd: string[] = [];
  const galleryRaw = formData.get("galleryFiles");
  if (typeof galleryRaw === "string" && galleryRaw) {
    try {
      const arr = JSON.parse(galleryRaw);
      if (Array.isArray(arr)) {
        const current = provider.providerProfile?.gallery ?? [];
        for (const item of arr.slice(0, Math.max(0, 12 - current.length))) {
          if (typeof item === "string" && item.startsWith("data:image")) {
            const p = await savePhotoDataUrl(item);
            if (p) galleryAdd.push(p);
          } else if (typeof item === "string" && item.startsWith("/uploads/")) {
            galleryAdd.push(item);
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  await prisma.providerProfile.update({
    where: { id: d.profileId },
    data: {
      name: d.name,
      category: d.category as never,
      subcategory: d.subcategory || null,
      description: d.description,
      address: d.address,
      district: nearestDistrict(d.lat, d.lng),
      lat: d.lat,
      lng: d.lng,
      phone: d.phone || null,
      email: d.email || null,
      website: d.website || null,
      instagram: d.instagram || null,
      facebook: d.facebook || null,
      booksy: d.booksy || null,
      minAge: d.minAge,
      maxAge: d.maxAge,
      priceFrom: d.priceFrom ?? null,
      priceUnit: d.priceUnit || "per lesson",
      coverImage: cover,
      ...(galleryAdd.length ? { gallery: { push: galleryAdd } } : {}),
    },
  });
  revalidatePath("/dashboard");
  revalidatePath(`/provider/${provider.providerProfile?.slug ?? ""}`);
  return { ok: true };
}

const serviceSchema = z.object({
  profileId: z.string().min(1),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  price: z.coerce.number().int().min(0).max(100000),
  priceUnit: z.string().max(40).optional().or(z.literal("")),
  ageMin: z.coerce.number().int().min(0).max(18).default(3),
  ageMax: z.coerce.number().int().min(3).max(99).default(99),
});

export async function upsertServiceAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let provider;
  try {
    provider = await requireProvider();
  } catch {
    return { ok: false, error: "Provider sign-in required." };
  }
  const parsed = serviceSchema.safeParse({
    profileId: formData.get("profileId"),
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    priceUnit: String(formData.get("priceUnit") || ""),
    ageMin: formData.get("ageMin") ?? 3,
    ageMax: formData.get("ageMax") ?? 99,
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid service." };
  const d = parsed.data;
  if (provider.providerProfile?.id !== d.profileId)
    return { ok: false, error: "Not authorized." };

  const serviceId = String(formData.get("serviceId") || "");
  if (serviceId) {
    const existing = await prisma.service.findFirst({
      where: { id: serviceId, profileId: d.profileId },
    });
    if (!existing) return { ok: false, error: "Service not found." };
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        title: d.title,
        description: d.description,
        price: d.price,
        priceUnit: d.priceUnit || "per lesson",
        ageMin: d.ageMin,
        ageMax: d.ageMax,
      },
    });
  } else {
    await prisma.service.create({
      data: {
        profileId: d.profileId,
        title: d.title,
        description: d.description,
        price: d.price,
        priceUnit: d.priceUnit || "per lesson",
        ageMin: d.ageMin,
        ageMax: d.ageMax,
      },
    });
  }
  revalidatePath("/dashboard");
  revalidatePath(`/provider/${provider.providerProfile?.slug ?? ""}`);
  return { ok: true };
}

export async function deleteServiceAction(serviceId: string): Promise<ActionResult> {
  try {
    const provider = await requireProvider();
    const svc = await prisma.service.findFirst({
      where: { id: serviceId, profileId: provider.providerProfile?.id },
    });
    if (!svc) return { ok: false, error: "Not found." };
    await prisma.service.delete({ where: { id: serviceId } });
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Not authorized." };
  }
}

export async function markNotificationsReadAction(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Not authorized." };
  }
}
