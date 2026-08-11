import type { PixelLabGenerateRequest, PixelLabGenerateResponse } from "./types";

export class PixelLabClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.pixellab.ai/v2",
  ) {}

  async generate(request: PixelLabGenerateRequest): Promise<PixelLabGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/create-image-pixflux`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`PixelLab ${response.status}: ${await response.text()}`);
    return (await response.json()) as PixelLabGenerateResponse;
  }
}
