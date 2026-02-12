import type { RestaurantCard } from "@/types/restaurant";

export const pickRandomRestaurant = (restaurants: RestaurantCard[]): RestaurantCard | null => {
  if (!restaurants.length) {
    return null;
  }

  const index = Math.floor(Math.random() * restaurants.length);
  return restaurants[index] ?? null;
};
