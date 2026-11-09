export type StreamFormat = 'dash' | 'hls';

export interface StreamSource {
  url: string;
  format: StreamFormat;
  /** Human readable origin of the test stream, shown in the diagnostics panel. */
  provider: string;
}

export interface Title {
  id: string;
  title: string;
  year: number;
  maturity: string;
  durationLabel: string;
  genres: string[];
  synopsis: string;
  poster: string;
  backdrop: string;
  stream: StreamSource;
  /** Licensing / attribution note for real open movies. */
  credit?: string;
}

export interface Rail {
  id: string;
  title: string;
  items: Title[];
}
