import { chromium } from "playwright";
const B = "http://127.0.0.1:8080";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

await p.goto(B, { waitUntil: "networkidle" });
await p.screenshot({ path: "/tmp/shot-home.png" });

await p.goto(`${B}/search`, { waitUntil: "networkidle" });
await p.screenshot({ path: "/tmp/shot-search.png" });

await p.getByRole("button", { name: /Map/ }).click();
await p.waitForSelector(".leaflet-tile-loaded", { timeout: 15000 });
await p.waitForTimeout(3000);
await p.screenshot({ path: "/tmp/shot-map.png" });

await p.goto(`${B}/provider/warszaw-szachtar-pro-school`, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await p.screenshot({ path: "/tmp/shot-profile.png" });
await b.close();
console.log("shots done");
