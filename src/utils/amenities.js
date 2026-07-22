export const AMENITY_ICON_MAP = {
  'Wi-Fi': 'wifi',
  'Kolam Renang': 'pool',
  'Private Pool': 'pool',
  'Ocean View': 'waves',
  'Oceanfront': 'water',
  'Gym': 'fitness_center',
  'Spa': 'spa',
  'Breakfast': 'free_breakfast',
  'Parking': 'local_parking',
  'AC': 'ac_unit',
  'Bathtub': 'bathtub',
  'Balcony': 'balcony',
  'Restaurant': 'restaurant',
  'King Bed': 'king_bed',
  'Queen Bed': 'bed',
  'Twin Bed': 'single_bed',
  'Smart TV': 'tv',
  'Jacuzzi': 'hot_tub',
  'Hot Tub': 'hot_tub',
  'Workspace': 'desk',
  'Mini Bar': 'local_bar',
  'Chef Pribadi': 'restaurant',
};

/**
 * Returns a Material Symbols icon name for a given amenity string.
 * @param {string} name 
 * @returns {string} Material Symbols icon string
 */
export const getAmenityIcon = (name = '') => {
  if (!name) return 'stars';
  
  if (AMENITY_ICON_MAP[name]) {
    return AMENITY_ICON_MAP[name];
  }

  const lower = String(name).toLowerCase();
  
  if (lower.includes('wifi') || lower.includes('wi-fi')) return 'wifi';
  if (lower.includes('pool') || lower.includes('renang')) return 'pool';
  if (lower.includes('ocean') || lower.includes('view') || lower.includes('pantai') || lower.includes('laut')) return 'waves';
  if (lower.includes('gym') || lower.includes('fit')) return 'fitness_center';
  if (lower.includes('spa')) return 'spa';
  if (lower.includes('breakfast') || lower.includes('sarapan')) return 'free_breakfast';
  if (lower.includes('park')) return 'local_parking';
  if (lower.includes('ac')) return 'ac_unit';
  if (lower.includes('bathtub') || lower.includes('mandi')) return 'bathtub';
  if (lower.includes('balkon') || lower.includes('balcony')) return 'balcony';
  if (lower.includes('rest') || lower.includes('makan')) return 'restaurant';
  if (lower.includes('king')) return 'king_bed';
  if (lower.includes('twin')) return 'single_bed';
  if (lower.includes('bed') || lower.includes('kasur')) return 'bed';
  if (lower.includes('tv')) return 'tv';
  if (lower.includes('jacuzzi') || lower.includes('tub')) return 'hot_tub';
  if (lower.includes('work') || lower.includes('desk') || lower.includes('kerja')) return 'desk';
  if (lower.includes('bar')) return 'local_bar';
  if (lower.includes('chef')) return 'restaurant';

  return 'stars';
};
