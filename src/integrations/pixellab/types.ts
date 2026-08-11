export interface PixelLabGenerateRequest {
  description: string;
  image_size: { width: number; height: number };
  no_background: boolean;
  isometric: boolean;
  outline: "single color black outline" | "single color outline" | "selective outline" | "lineless";
  seed?: number;
}

export interface PixelLabGenerateResponse {
  image: { type: "base64"; base64: string };
  usage?: { type: string; usd: number };
}
