import type { CaseEngine } from "../core/case/CaseEngine";
import { escapeHtml } from "./html";

export class MapPanel {
  constructor(private readonly engine: CaseEngine) {}

  render(): string {
    const state = this.engine.snapshot();
    const stage = this.engine.currentStage();
    return stage.unlockedRooms
      .map((id) => this.engine.bundle.rooms.find((room) => room.id === id))
      .filter(Boolean)
      .map(
        (
          room,
        ) => `<button class="room-tab ${state.currentRoomId === room!.id ? "is-active" : ""}" data-action="visit-room" data-id="${room!.id}">
          <span>${state.visitedRoomIds.includes(room!.id) ? "●" : "○"}</span>${escapeHtml(room!.name)}
        </button>`,
      )
      .join("");
  }
}
