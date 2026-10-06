import { getDeviceId } from "./deviceId";

// Onboarding profile — accumulates the user's setup choices, saved per device.
// Grows step by step (location type now; address and beyond added later).
export type OnboardingProfile = {
  locationType?: string; // Home | Workplace | Retail Space | Restaurant or Bar | Other
  otherLabel?: string;   // free text when locationType === "Other"
  address?: string;      // display location's address (optional); anchors the stop suggester later
  lat?: number;          // geocoded address coordinates (for the geospatial suggester)
  lon?: number;
  modes?: string[];      // selected transportation mode ids; drives the config step
};

const key = (id?: string) => `onboarding_profile_${id || getDeviceId()}`;

export function getOnboardingProfile(deviceId?: string): OnboardingProfile {
  try {
    const raw = localStorage.getItem(key(deviceId));
    if (raw) return JSON.parse(raw) as OnboardingProfile;
  } catch {}
  return {};
}

export function saveOnboardingProfile(patch: Partial<OnboardingProfile>, deviceId?: string): OnboardingProfile {
  const next = { ...getOnboardingProfile(deviceId), ...patch };
  localStorage.setItem(key(deviceId), JSON.stringify(next));
  return next;
}
