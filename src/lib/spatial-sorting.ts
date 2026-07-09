interface Location {
  latitude: number;
  longitude: number;
}

export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (loc1.latitude * Math.PI) / 180;
  const phi2 = (loc2.latitude * Math.PI) / 180;
  const deltaPhi = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const deltaLambda = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // In meters
}

export function sortCrewsByProximity(alertLoc: { lat: number; lng: number }, crews: any[]) {
  return crews
    .map((crew) => ({
      ...crew,
      distance: calculateDistance(
        { latitude: alertLoc.lat, longitude: alertLoc.lng },
        { latitude: crew.latitude, longitude: crew.longitude }
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
}
