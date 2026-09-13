import { calculateDistance } from './haversine.js';

export const isWithinRadius = (lat1, lon1, lat2, lon2, maxRadiusKm = 15) => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return {
    distance_km: Math.round(distance * 10) / 10,
    is_within_radius: distance <= maxRadiusKm
  };
};

export const estimateDeliveryTimeMinutes = (distanceKm) => {
  // Base 15 mins prep + 3 mins per km
  return Math.round(15 + (distanceKm * 3));
};
