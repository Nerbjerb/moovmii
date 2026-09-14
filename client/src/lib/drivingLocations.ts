import { getDeviceId } from "./deviceId";

// Favorite driving locations: nicknamed addresses (Home, Work, Grandma's House...)
// stored per device. Route slots reference pairs of these.

export type DrivingLocation = { id: string; name: string; address: string };

const storageKey = (deviceId?: string) => `driving_locations_${deviceId || getDeviceId()}`;

export function getDrivingLocations(deviceId?: string): DrivingLocation[] {
  try {
    const raw = localStorage.getItem(storageKey(deviceId));
    if (raw) return JSON.parse(raw) as DrivingLocation[];
  } catch {}
  return [];
}

export function saveDrivingLocations(locations: DrivingLocation[], deviceId?: string): void {
  localStorage.setItem(storageKey(deviceId), JSON.stringify(locations));
}

export function upsertDrivingLocation(loc: DrivingLocation, deviceId?: string): DrivingLocation[] {
  const list = getDrivingLocations(deviceId);
  const idx = list.findIndex((l) => l.id === loc.id);
  if (idx >= 0) list[idx] = loc;
  else list.push(loc);
  saveDrivingLocations(list, deviceId);
  return list;
}

export function deleteDrivingLocation(id: string, deviceId?: string): DrivingLocation[] {
  const list = getDrivingLocations(deviceId).filter((l) => l.id !== id);
  saveDrivingLocations(list, deviceId);
  return list;
}

export function newLocationId(): string {
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
