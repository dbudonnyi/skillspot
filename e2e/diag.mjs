import { chromium } from "playwright";
const BASE = "http://127.0.0.1:8081";
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 500)));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 400)); });

// 1) logged-in provider: bell + dialog interactions
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill('#email', "demo@szachtar.pl");
await page.fill('#password', "demo1234");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 60000 });
console.log("-- logged in");

await page.locator("button:has(svg.lucide-bell)").click();
await page.waitForTimeout(1500);
console.log("-- bell opened");

await page.keyboard.press("Escape");
await page.goto(`${BASE}/provider/crocodile-swimming-school`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Show contact/ }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: /Request to join/ }).click();
await page.waitForTimeout(1500);
console.log("-- dialog opened, filling");
await page.fill('#msg', "diag test message with more than ten chars");
await page.fill('#ce', "x@y.z");
await page.click('button:has-text("Send request")');
await page.waitForTimeout(3000);
console.log("-- after send, dialog open?", await page.locator('[role="dialog"], [data-slot="dialog-content"]').first().isVisible().catch(() => false));

await page.goto(`${BASE}/provider/nastula-club-2785`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
console.log("-- review textarea visible?", await page.locator('textarea[name="text"]').isVisible().catch(() => false));
console.log("-- owner box?", await page.locator("text=can't review").isVisible().catch(() => false));
await browser.close();
