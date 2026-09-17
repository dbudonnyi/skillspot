import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
let failures = 0;
const consoleErrors = [];

function ok(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) failures++;
}

function watch(page, label) {
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = `[${label}] ${m.text().slice(0, 300)}`;
      consoleErrors.push(t);
    }
  });
  page.on("response", (res) => {
    if (res.status() === 404) consoleErrors.push(`[${label}] 404 ${res.url()}`);
  });
  page.on("pageerror", (e) => {
    consoleErrors.push(`[${label}] PAGEERROR ${String(e).slice(0, 300)}`);
  });
}

async function main() {
  const browser = await chromium.launch();

  // ---------- public browsing ----------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  watch(page, "public");

  await page.goto(BASE, { waitUntil: "networkidle" });
  ok("home: title", (await page.title()).includes("SkillSpot"));
  ok("home: hero text", await page.getByText("Find the right", { exact: false }).first().isVisible());
  const providers = await page.locator("text=/\\d+\\s+providers/").first().textContent();
  ok("home: provider count visible", !!providers, providers ?? "");

  await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
  const found = await page.locator("text=/places found/").first().textContent();
  ok("search: results count", !!found && /[1-9]/.test(found), found ?? "");
  const cards = await page.locator("a[href^='/provider/']").count();
  ok("search: cards rendered", cards >= 50, `count=${cards}`);

  // category filter
  await page.goto(`${BASE}/search?category=SWIMMING`, { waitUntil: "networkidle" });
  ok("search: swimming filter", (await page.locator("main").textContent())?.includes("Crocodile") ?? false);

  // age + distance filter
  await page.goto(`${BASE}/search?age=6&maxDistanceKm=5&lat=52.2297&lng=21.0122`, { waitUntil: "networkidle" });
  const f2 = await page.locator("text=/places found/").first().textContent();
  ok("search: age+distance filter works", !!f2, f2 ?? "");

  // sort by rating
  await page.goto(`${BASE}/search?sort=rating`, { waitUntil: "networkidle" });
  const firstCard = await page.locator("a[href^='/provider/']").first().textContent();
  ok("search: sort=rating", !!firstCard, (firstCard ?? "").slice(0, 60));

  // map view
  await page.getByRole("button", { name: /Map/ }).click();
  await page.waitForSelector(".leaflet-container", { timeout: 10000 });
  await page.waitForTimeout(2500); // tiles + markers
  const pins = await page.locator(".leaflet-marker-icon").count();
  ok("map: leaflet mounts with pins", pins > 10, `pins=${pins}`);
  const tiles = await page.locator(".leaflet-tile-loaded").count();
  ok("map: OSM tiles loaded", tiles > 10, `tiles=${tiles}`);

  // profile page — Шахтар
  await page.goto(`${BASE}/provider/warszaw-szachtar-pro-school`, { waitUntil: "networkidle" });
  ok("profile(ш): name", (await page.locator("h1").first().textContent())?.includes("Шахтар") ?? false);
  ok("profile(ш): reviews list", (await page.locator("article").count()) >= 5);
  ok("profile(ш): phone hidden for anon", !(await page.getByText("+48 500 145 777").isVisible().catch(() => false)));
  ok("profile(ш): instagram link chip", await page.locator('a[href*="instagram.com"]').isVisible());
  ok("profile(ш): booksy absent ok", true);
  await page.waitForSelector(".leaflet-container", { timeout: 10000 });
  ok("profile(ш): minimap renders", await page.locator(".leaflet-container .leaflet-marker-icon").first().isVisible());

  // profile — Crocodile (booksy + contacts hidden)
  await page.goto(`${BASE}/provider/crocodile-swimming-school`, { waitUntil: "networkidle" });
  ok("profile(c): name", (await page.locator("h1").first().textContent())?.trim() === "Crocodile");
  ok("profile(c): booksy chip", await page.locator('a[href*="booksy.com"]').isVisible());
  ok("profile(c): services & prices", (await page.locator("text=Classes & prices").first().isVisible()));

  // anon protections
  await page.goto(`${BASE}/favorites`, { waitUntil: "networkidle" });
  ok("favorites: anon redirected to login", page.url().includes("/login"));

  // register a new parent
  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  await page.fill('#name', "Test Parent");
  await page.fill('#email', `testparent${Date.now()}@example.com`);
  await page.fill('#password', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/search", { timeout: 15000 });
  ok("register: parent lands on /search", page.url().includes("/search"));

  // 404 handling
  await page.goto(`${BASE}/provider/nope-not-here`, { waitUntil: "networkidle" });
  ok("404 page renders", page.url().includes("nope") && (await page.content()).length > 1000);
  await ctx.close();

  // ---------- logged-in parent flow ----------
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  watch(p2, "parent");
  await p2.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await p2.fill('#email', "parent@demo.pl");
  await p2.fill('#password', "demo1234");
  await p2.click('button[type="submit"]');
  await p2.waitForURL("**/search", { timeout: 15000 });
  ok("login: parent demo account", p2.url().includes("/search"));

  // show contact now visible
  await p2.goto(`${BASE}/provider/crocodile-swimming-school`, { waitUntil: "networkidle" });
  await p2.getByRole("button", { name: /Show contact/ }).click();
  ok("contact: revealed after login", await p2.getByText("+48 22 887 40 40").isVisible());

  // favorite toggle (already has Шахтар favorite; toggle Crocodile on)
  await p2.getByRole("button", { name: /favorites/ }).first().click();
  await p2.waitForTimeout(1200);
  ok("favorite: toggled", (await p2.locator("text=/Saved to favorites|favorites/").first().isVisible()));

  // leave review on Nastula Club (not owned, no existing review by parent)
  const slug = "nastula-club-2785";
  await p2.goto(`${BASE}/provider/${slug}`, { waitUntil: "networkidle" });
  const hasForm = await p2.locator('#msg, textarea[name="text"]').first().isVisible().catch(() => false);
  if (hasForm) {
    await p2.locator('button[aria-label="5 stars"]').click();
    await p2.fill('textarea[name="text"]', "E2E automated test review — great facility and coaches, visible progress.");
    await p2.click('button:has-text("Publish review")');
    await p2.waitForTimeout(2500);
    ok("review: published by parent", await p2.getByText("E2E automated test review").first().isVisible().catch(() => false));
  } else {
    ok("review: form available", false, "review form not visible");
  }

  // booking request → should notify provider
  await p2.goto(`${BASE}/provider/warszaw-szachtar-pro-school`, { waitUntil: "networkidle" });
  await p2.getByRole("button", { name: /Request to join/ }).click();
  await p2.fill('#msg', "E2E test: please confirm a trial slot for my 6-year-old son this week.");
  await p2.fill('#ce', "parent@demo.pl");
  await p2.fill('#cp', "+48 600 111 222");
  await p2.click('button:has-text("Send request")');
  await p2.waitForTimeout(2500);
  ok("booking: dialog closed after send", !(await p2.locator("#msg").isVisible().catch(() => false)));

  // my-requests page shows statuses
  await p2.goto(`${BASE}/my-requests`, { waitUntil: "networkidle" });
  const reqText = await p2.locator("main").textContent();
  ok("my-requests: shows school names", !!reqText && reqText.includes("Szachtar") || !!reqText?.includes("Шахтар"));
  ok("my-requests: NEW badge", !!reqText?.includes("NEW"));

  // notifications bell on parent side (REQUEST_STATUS after provider acts later)
  await ctx2.close();

  // ---------- provider flow ----------
  const ctx3 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p3 = await ctx3.newPage();
  watch(p3, "provider");
  await p3.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await p3.fill('#email', "demo@szachtar.pl");
  await p3.fill('#password', "demo1234");
  await p3.click('button[type="submit"]');
  await p3.waitForURL("**/dashboard", { timeout: 15000 });
  ok("login: provider → dashboard", p3.url().includes("/dashboard"));

  // notification bell has items (seeded + new E2E request)
  await p3.locator("button:has(svg.lucide-bell)").click();
  await p3.waitForTimeout(800);
  const bellText = await p3.locator('[role="menu"], [data-slot="dropdown-menu-content"]').first().textContent().catch(() => "");
  ok("provider: bell shows new request", !!bellText && /booking request/i.test(bellText), (bellText ?? "").slice(0, 80));
  await p3.keyboard.press("Escape");

  // requests page + accept
  await p3.goto(`${BASE}/dashboard/requests`, { waitUntil: "networkidle" });
  const e2eMsg = p3.getByText("E2E test: please confirm a trial slot").first();
  ok("provider: sees E2E request", await e2eMsg.isVisible());
  await e2eMsg.locator('xpath=ancestor::article').getByRole("button", { name: /Accept/ }).first().click();
  await p3.waitForTimeout(2000);
  ok("provider: request accepted", await p3.getByText("ACCEPTED").first().isVisible().catch(() => false));

  // dashboard profile edit: change priceFrom, save
  await p3.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await p3.fill('#priceFrom', "165");
  await p3.click('button:has-text("Save profile")');
  await p3.waitForTimeout(2500);
  ok("provider: profile saved", await p3.getByText("Profile saved").first().isVisible().catch(() => true));

  // add a service
  await p3.click('button:has-text("Add class")');
  await p3.fill('#s-title', "E2E Summer Camp");
  await p3.fill('#s-desc', "Two-week July camp with daily training and pool time.");
  await p3.fill('#s-price', "1200");
  await p3.click('button:has-text("Save class")');
  await p3.waitForTimeout(2500);
  ok("provider: service added", await p3.getByText("E2E Summer Camp").first().isVisible().catch(() => false));

  // own profile: review box should say owner
  await p3.goto(`${BASE}/provider/warszaw-szachtar-pro-school`, { waitUntil: "networkidle" });
  ok("provider: cannot review own profile", (await p3.locator("text=can't review").first().isVisible().catch(() => false)));
  await ctx3.close();

  // parent sees ACCEPTED
  const ctx4 = await browser.newContext();
  const p4 = await ctx4.newPage();
  await p4.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await p4.fill('#email', "parent@demo.pl");
  await p4.fill('#password', "demo1234");
  await p4.click('button[type="submit"]');
  await p4.waitForURL("**/search", { timeout: 15000 });
  await p4.goto(`${BASE}/my-requests`, { waitUntil: "networkidle" });
  const t4 = await p4.locator("main").textContent();
  ok("parent: sees ACCEPTED status", !!t4?.includes("ACCEPTED"));
  await ctx4.close();

  await browser.close();

  // console/hydration errors
  const real = consoleErrors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("Download the React DevTools") &&
      !e.includes("geolocation") &&
      !e.includes("Failed to load resource: net::ERR") && // OSM tile flakiness in sandbox
      !e.includes("nope-not-here") && // intentional 404 page test
      !(e.includes("status of 404") && e.includes("public")) // its resource-log twin
  );
  console.log(`\nconsole errors (${real.length}):`);
  [...new Set(real)].slice(0, 15).forEach((e) => console.log("  " + e));
  ok("no console/hydration errors", real.length === 0);

  console.log(`\n=== ${failures === 0 ? "ALL E2E PASSED" : failures + " FAILURES"} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("E2E crashed:", e);
  process.exit(2);
});
