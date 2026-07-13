export function getLowestRoomPrice(rooms, fallbackPrice = 0) {
  const roomPrices = (Array.isArray(rooms) ? rooms : [])
    .filter((room) => room?.is_active !== false)
    .map((room) => Number(room?.price))
    .filter((price) => Number.isFinite(price) && price >= 0);

  if (roomPrices.length > 0) {
    return Math.min(...roomPrices);
  }

  const fallback = Number(fallbackPrice);
  return Number.isFinite(fallback) && fallback >= 0 ? fallback : 0;
}
