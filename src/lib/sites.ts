// One sensor as both the globe and the map draw it. Shared so the two stages
// agree without importing each other.
export interface GlobeSite {
  id: string;
  name: string;
  sub: string;
  lat: number;
  lon: number;
  tone: string;
  retired?: boolean;
}
