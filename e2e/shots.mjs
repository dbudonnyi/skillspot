import { chromium } from "playwright";
const B = "http://127.0.0.1:8080";
const b = await chromium.launch();

const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(B, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
await p.screenshot({ path: "/tmp/shot-home-en.png" });

await p.goto(`${B}/search?sort=rating`, { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
await p.screenshot({ path: "/tmp/shot-list.png" });

await p.goto(`${B}/provider/warszaw-szachtar-pro-school`, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
const tr = p.getByTestId("translate-toggle").first();
if (await tr.isVisible().catch(() => false)) {
  await tr.click();
  await p.waitForTimeout(5000);
}
await p.screenshot({ path: "/tmp/shot-profile-translated.png" });
await ctx.close();

const ctxPl = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: "pl-PL" });
const pPl = await ctxPl.newPage();
await pPl.goto(B, { waitUntil: "networkidle" });
await pPl.waitForTimeout(1000);
await pPl.screenshot({ path: "/tmp/shot-home-pl.png" });
await ctxPl.close();

const ctxGeo = await b.newContext({
  viewport: { width: 1440, height: 900 },
  geolocation: { latitude: 52.2297, longitude: 21.0122 },
});
await ctxGeo.grantPermissions(["geolocation"]);
const pGeo = await ctxGeo.newPage();
await pGeo.goto(B, { waitUntil: "networkidle" });
await pGeo.getByTestId("hero-near-me").click();
await pGeo.waitForURL(/near=1/, { timeout: 15000 }).catch(() => {});
await pGeo.waitForTimeout(1500);
await pGeo.getByRole("button", { name: /^Map/ }).click();
await pGeo.waitForSelector(".leaflet-container", { timeout: 10000 });
await pGeo.waitForTimeout(3000);
await pGeo.screenshot({ path: "/tmp/shot-map-nearme.png" });
await ctxGeo.close();

await b.close();
console.log("shots done");
