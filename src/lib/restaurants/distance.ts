const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (value: number): number => (value * Math.PI) / 180;

export const haversineDistanceMeters = (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): number => {
  const latDelta = toRadians(endLat - startLat);
  const lngDelta = toRadians(endLng - startLng);

  const startLatRads = toRadians(startLat);
  const endLatRads = toRadians(endLat);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(startLatRads) * Math.cos(endLatRads) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
};
