import { expect, test } from "@playwright/test";

test.describe("public routes", () => {
  test("homepage renders Bulgarian content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Търсиш части",
    );
    await expect(page.getByRole("link", { name: "Свържи се с нас" })).toBeVisible();
  });

  test("articles index lists categories", async ({ page }) => {
    await page.goto("/articles");
    await expect(page.getByRole("heading", { name: "Статии" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Всички" })).toBeVisible();
  });

  test("about page", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Експертиза",
    );
  });

  test("order page shows form fields", async ({ page }) => {
    await page.goto("/order");
    await expect(page.getByLabel("Марка")).toBeVisible();
    await expect(page.getByLabel("Модел")).toBeVisible();
    await expect(page.getByLabel("Какво търсиш")).toBeVisible();
  });

  test("contact page", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Свържи се с нас" })).toBeVisible();
  });

  test("admin redirects unauthenticated to /login", async ({ page }) => {
    const res = await page.goto("/admin");
    expect(res?.url()).toContain("/login");
  });
});
