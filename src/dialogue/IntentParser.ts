import type { QuestionIntent } from "../core/case/schemas";

const DICTIONARY: Record<QuestionIntent, Array<[string, number]>> = {
  LOCATION: [
    ["어디", 5],
    ["장소", 4],
    ["사무실", 2],
    ["회의실", 2],
    ["휴게실", 2],
    ["위치", 4],
  ],
  USB: [
    ["usb", 6],
    ["유에스비", 6],
    ["프로토타입", 4],
    ["붉은", 1],
  ],
  OBJECT: [
    ["물건", 4],
    ["메모", 4],
    ["카드", 4],
    ["열쇠", 4],
    ["영수증", 4],
    ["태그", 3],
    ["컵", 2],
  ],
  PERSON: [
    ["누구", 4],
    ["사람", 3],
    ["봤", 3],
    ["민수", 4],
    ["지연", 4],
    ["준호", 4],
    ["서연", 4],
  ],
  TIMELINE: [
    ["언제", 5],
    ["시간", 4],
    ["몇 시", 5],
    ["순서", 3],
    ["전후", 3],
    ["퇴근", 2],
  ],
  ALIBI: [
    ["알리바이", 6],
    ["증명", 3],
    ["기록", 2],
    ["근거", 2],
  ],
  MOTIVE: [
    ["왜", 5],
    ["이유", 4],
    ["동기", 6],
    ["목적", 3],
  ],
  OTHER: [],
};

export interface ParsedIntent {
  intent: QuestionIntent;
  confidence: number;
}

export class IntentParser {
  normalize(text: string): string {
    return text
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[?!.,~…]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  parse(text: string): ParsedIntent {
    const normalized = this.normalize(text);
    let best: ParsedIntent = { intent: "OTHER", confidence: 0 };
    for (const [intent, entries] of Object.entries(DICTIONARY) as Array<
      [QuestionIntent, Array<[string, number]>]
    >) {
      const score = entries.reduce(
        (sum, [keyword, weight]) => sum + (normalized.includes(keyword) ? weight : 0),
        0,
      );
      if (score > best.confidence) best = { intent, confidence: score };
    }
    return best.confidence >= 2 ? best : { intent: "OTHER", confidence: best.confidence };
  }
}
