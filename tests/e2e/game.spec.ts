import { expect, test, type Page } from "@playwright/test";

async function clickAction(page: Page, action: string, id?: string) {
  const selector = id ? `[data-action="${action}"][data-id="${id}"]` : `[data-action="${action}"]`;
  await page.locator(selector).last().click();
}

async function closeResult(page: Page) {
  await clickAction(page, "close-modal");
}

async function reachStage3(page: Page) {
  await clickAction(page, "examine-hotspot", "usb-dock");
  await closeResult(page);
  await clickAction(page, "examine-hotspot", "note-bin");
  await clickAction(page, "advance-stage");
  await clickAction(page, "examine-hotspot", "desk-floor");
  await closeResult(page);
  await clickAction(page, "visit-room", "meeting");
  await clickAction(page, "examine-hotspot", "meeting-table");
  await closeResult(page);
  await clickAction(page, "visit-room", "lounge");
  await expect
    .poll(async () =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("trace-case-001-save-v1") ?? "{}").pendingStage,
      ),
    )
    .toBe(3);
  await clickAction(page, "advance-stage");
  await expect
    .poll(async () =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("trace-case-001-save-v1") ?? "{}").currentStage,
      ),
    )
    .toBe(3);
  await expect(page.locator("#stage-kicker")).toContainText("STAGE 3");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await clickAction(page, "new-game");
});

test("normal clear with wrong deduction retry", async ({ page }) => {
  await reachStage3(page);
  for (const id of ["minsu", "jiyeon", "junho", "seoyeon"]) {
    if (id === "minsu") await clickAction(page, "open-interview");
    await clickAction(page, "select-character", id);
  }
  await clickAction(page, "select-character", "seoyeon");
  await clickAction(page, "present-evidence-direct", "blue-card");
  await clickAction(page, "present-evidence-direct", "locker-tag");
  await clickAction(page, "advance-stage");
  await clickAction(page, "visit-room", "lounge");
  await clickAction(page, "examine-hotspot", "cup-return");
  await closeResult(page);
  await clickAction(page, "visit-room", "meeting");
  await clickAction(page, "examine-hotspot", "locker-2b");
  await closeResult(page);
  await clickAction(page, "open-interview");
  await clickAction(page, "select-character", "seoyeon");
  await clickAction(page, "present-evidence-direct", "usb-red");
  await clickAction(page, "advance-stage");
  await clickAction(page, "open-deduction");
  await clickAction(page, "select-suspect", "minsu");
  for (const id of ["empty-slot", "blue-card", "usb-red"])
    await clickAction(page, "toggle-final-evidence", id);
  await clickAction(page, "select-final-contradiction", "seoyeon-touch-conflict");
  await clickAction(page, "submit-deduction");
  await expect(page.locator(".deduction-feedback")).toBeVisible();
  await clickAction(page, "select-suspect", "seoyeon");
  await clickAction(page, "submit-deduction");
  await expect(page.locator(".ending-seal")).toContainText("CLOSED");
});

test("restores stage 3 after reload", async ({ page }) => {
  await reachStage3(page);
  await page.reload();
  await clickAction(page, "continue-game");
  await expect(page.locator("#stage-kicker")).toContainText("STAGE 3");
  await expect(page.locator("#metric-evidence")).not.toHaveText("0");
});
