export type FillSessionConfig = {
  title: string;
  days: number[];
  startHour: number;
  endHour: number;
};

export type FillSessionResponse = {
  name: string;
  slots: Record<string, number[]>; // day string -> slot indices
};

function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

export function encodeFillSession(config: FillSessionConfig): string {
  return toBase64(JSON.stringify(config));
}

export function decodeFillSession(encoded: string): FillSessionConfig | null {
  try {
    return JSON.parse(fromBase64(encoded)) as FillSessionConfig;
  } catch {
    return null;
  }
}

export function encodeFillResponse(response: FillSessionResponse): string {
  return toBase64(JSON.stringify(response));
}

export function decodeFillResponse(encoded: string): FillSessionResponse | null {
  try {
    return JSON.parse(fromBase64(encoded)) as FillSessionResponse;
  } catch {
    return null;
  }
}
