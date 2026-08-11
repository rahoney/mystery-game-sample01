import { describe, expect, it } from "vitest";
import { IntentParser } from "../../src/dialogue/IntentParser";

describe("IntentParser", () => {
  const parser = new IntentParser();
  it.each([
    ["20시쯤 어디에 있었나요?", "LOCATION"],
    ["붉은 USB를 본 적 있어요?", "USB"],
    ["서연 씨를 봤나요?", "PERSON"],
    ["왜 다시 돌아왔죠?", "MOTIVE"],
    ["알리바이를 증명할 기록이 있나요", "ALIBI"],
  ])("parses %s", (text, expected) => expect(parser.parse(text).intent).toBe(expected));
  it("falls back safely", () => expect(parser.parse("그렇군요").intent).toBe("OTHER"));
});
