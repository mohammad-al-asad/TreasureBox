export const calculateDistanceInKm = (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): number => {
  const radiusKm = 6371;
  const toRadians = (value: number): number => (value * Math.PI) / 180;
  const dLat = toRadians(destination.latitude - origin.latitude);
  const dLon = toRadians(destination.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return Number((2 * radiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
};
