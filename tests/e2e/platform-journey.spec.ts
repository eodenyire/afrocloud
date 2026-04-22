import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outputDir = resolve(process.cwd(), "screenshots");

test("capture platform journey screens", async ({ page, baseURL }) => {
  mkdirSync(outputDir, { recursive: true });

  const routes = [
    { path: "/auth", file: "01-auth.png" },
    { path: "/onboarding", file: "02-onboarding.png" },
    { path: "/console", file: "03-console.png" },
    { path: "/console/compute", file: "04-compute.png" },
    { path: "/console/storage", file: "05-storage.png" },
    { path: "/console/databases", file: "06-databases.png" },
    { path: "/console/networking", file: "07-networking.png" },
    { path: "/console/iam", file: "08-iam-multi-user.png" },
    { path: "/console/developers", file: "09-deployers.png" },
    { path: "/console/audit", file: "10-audit.png" },
  ];

  for (const route of routes) {
    await page.goto(`${baseURL ?? "http://127.0.0.1:4173"}${route.path}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: resolve(outputDir, route.file), fullPage: true });
  }
});
