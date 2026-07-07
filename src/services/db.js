// Mock database of properties, destinations, and bookings
// Isolated for easy replacement with Supabase SDK later

const MOCK_DESTINATIONS = [
  {
    id: "amalfi",
    name: "Amalfi Coast, Italy",
    propertiesCount: 124,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAw55G6uev36lAW7owBE_aXu1gGqzqdUFR6OHdSdO8XIdXsyhP25Rf4jpvdk1n9VwO3YA_4R-PEaur9OrWiNVfgCqlbH_UMS1fbA1U2hveOHAagjNVf2pbNFhuxoaK8pfiDF5GBMusnhrneWdKzWZtbV51V21qi3ZTf5RSvKMg78nOtJSxE1PILkpG1BTscmXoIViS7I-tCLqZx34l_n7UUjDpd6pkbrXmPS3s5t8iGbMNgbhDUjKw0"
  },
  {
    id: "santorini",
    name: "Santorini, Greece",
    propertiesCount: 86,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQg5tRKEFyt61KhCZk_6hU6hekJY44-r3UVGVIEqSvkvDjiHC5LRx9dzimupyIz5kDewZfSfhSXAPp3vDPNyAJHVK6lvlSiLWtEgzkFQy42FXubnVKFt5u7icAKANE5koiSY018pAjK01olIb5xRvKi_xoPO62AXlen9pEoENOAmjlet3FcSDfWwC_Jya5enHeAj61-RWVIImsb-m9Sf1xmGmEt7DXO4LlssJbkVHAanJWk7vgPpBz"
  },
  {
    id: "bali",
    name: "Bali, Indonesia",
    propertiesCount: 215,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXoY7UC7pYgwL9aq7YRW_XYXTbfg-YEhM5ubscbjI0HTJodspv5xpiRuHEQdMriUwfFy0-pKbk4VdBrEAq2tJ-qOvm89BUlTE6LTzzJi9F-VJUCvEGBGWou4Rnfa1ZmVT4dh9FPyTQVgouVWyu4AxCWG4eBPGAhfv4sXXwenzLI-HEqWPLgzsTvW6dE7DHNoyKLnNFWiW4WJ0s1PUESwwU6e6taZt-iQMLu4pL_eCXGjsSO39Fq-Z7"
  },
  {
    id: "dubai",
    name: "Dubai, UAE",
    propertiesCount: 340,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbY_3mgn39zc5oeMYAl5Vld02m003SIyCtsuS7HQi_PWFFbjIGKRvXaiZyyBpCJ7NROhfbmRFj-xDrLKMdQ2C28oa-kJnkARfBBnDvKLumjYEEVPvCFHvDfuO1U0pIfTnaKaiJNVMy-RBZBVQFxd1piLNo-Ooi-5N_6Y4HrXiTHDtioPQ5SE0RO6D_3GfP_QYd6jphGAZ7VTCRQB8OlihD_1mNZzH6VSoV0OVeaCPtNsbImvDzUVbD"
  }
];

const MOCK_PROPERTIES = [
  {
    id: "villa-azure",
    name: "Villa Azure Maldives",
    location: "North Malé Atoll, Maldives",
    region: "Maldives",
    price: 1250000,
    rating: 4.96,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC21jcMQBym39nr-abR-Gz2z5-AT21ErCDHRUlFi4FIjAVZyZwb8rTaCl-BKEdVWG4sRTRcGnMJ_IdVjEYXFWqlHHEYK6A1BGgRLKFWQv3IsLOe3VdhWfHGgQ2HbJnqJJhbLnHdNap-QX0cQMzNX0X9vcSDscBD6HS0zbtnbLq3GnFSXC4QZ5QpWpYdncc5YgPW8TbF608j2-0D74BxqS-ZX0m3F3f3VKi-kftJDU5LpPkT7_7mxsUq",
    description: "Satu mahakarya arsitektur modern di atas perairan jernih Maladewa. Villa Azure menawarkan pengalaman menginap mewah dengan dek kayu yang luas, kolam renang infinity pribadi, dan akses langsung ke terumbu karang tropis. Nikmati kemewahan murni dengan layanan pelayan pribadi 24 jam.",
    amenities: ["Private Pool", "Oceanfront", "Wi-Fi", "Pelayan Pribadi", "Spa"],
    rooms: [
      {
        id: "ocean-villa",
        name: "Ocean Villa dengan Kolam Pribadi",
        price: 1250000,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC21jcMQBym39nr-abR-Gz2z5-AT21ErCDHRUlFi4FIjAVZyZwb8rTaCl-BKEdVWG4sRTRcGnMJ_IdVjEYXFWqlHHEYK6A1BGgRLKFWQv3IsLOe3VdhWfHGgQ2HbJnqJJhbLnHdNap-QX0cQMzNX0X9vcSDscBD6HS0zbtnbLq3GnFSXC4QZ5QpWpYdncc5YgPW8TbF608j2-0D74BxqS-ZX0m3F3f3VKi-kftJDU5LpPkT7_7mxsUq",
        description: "Villa seluas 85m² di atas air dengan kolam renang pribadi, dek matahari, bak mandi luar ruangan, dan panel kaca di lantai untuk melihat kehidupan laut.",
        amenities: ["King Bed", "Private Pool", "Lantai Kaca", "Direct Ocean Access"]
      },
      {
        id: "beach-suite",
        name: "Beachfront Suite dengan Taman",
        price: 1100000,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM5KfIlaw4X5IXxQxfv6uuL5CxkJiFs-kZ55BQiTgx5IGKbLf8E4kqRzhdAGOl2qHIngUc_WK0i_CNAlUHR5bCfn2u87anyHvpc7R4k77JbAVrX-SdR0UeQMvidawM3IvhYAIv4lwnClisTT6me-BKczX1BNzCGNQJ7mvTGC1DXFnx4Df7-DM0r2fv9qS2sT0-oJI5hdzuE_2Mk7y8KvawNCjHam62shmFtWyUd-K4e0FOn05AOCl3",
        description: "Terletak langsung di pantai pasir putih dengan taman tropis tertutup, pancuran luar ruangan, dan akses langsung ke pantai.",
        amenities: ["King Bed", "Outdoor Shower", "Taman Pribadi", "Direct Beach Access"]
      }
    ]
  },
  {
    id: "alpine-vista",
    name: "Alpine Vista Chalet",
    location: "Zermatt, Switzerland",
    region: "Switzerland",
    price: 890000,
    rating: 4.88,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAN081jOKn86xj55M8IZXxq0L45NCSb44x2Z02KEideghZ7nHJ4wZ9bWu10A90qhP1alBO5EN_p2lt9_JixTD-doxefg4k2uYk77pb4B2rJnWkaGlNM9zeEVRWk7qIK1LF5Cb1jQha4XFJjb7t6IMzABiK94q7PU-W7jY0mu_7L4aDE7CuyrtZH0jID2LrK0BiKw3USLOTqFkBrzAXP0Yvm0ZCyTk12ivc_QEhoxi9kF6ZQ5jlxLzsv",
    description: "Chalet modern bernuansa hangat yang dikelilingi oleh pegunungan bersalju Zermatt yang megah. Menawarkan jendela kaca raksasa yang menghadap ke Matterhorn, perapian batu klasik, dan kolam air hangat luar ruangan untuk relaksasi musim dingin yang sempurna.",
    amenities: ["Ski-in/out", "Hot Tub", "Wi-Fi", "Perapian", "Pemandangan Gunung"],
    rooms: [
      {
        id: "matterhorn-suite",
        name: "Matterhorn View Suite",
        price: 990000,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAN081jOKn86xj55M8IZXxq0L45NCSb44x2Z02KEideghZ7nHJ4wZ9bWu10A90qhP1alBO5EN_p2lt9_JixTD-doxefg4k2uYk77pb4B2rJnWkaGlNM9zeEVRWk7qIK1LF5Cb1jQha4XFJjb7t6IMzABiK94q7PU-W7jY0mu_7L4aDE7CuyrtZH0jID2LrK0BiKw3USLOTqFkBrzAXP0Yvm0ZCyTk12ivc_QEhoxi9kF6ZQ5jlxLzsv",
        description: "Kamar suite premium dengan balkon luas menghadap langsung ke puncak Matterhorn yang legendaris, dilengkapi perapian gas dan kamar mandi marmer.",
        amenities: ["King Bed", "Matterhorn View", "Perapian Gas", "Balkon"]
      },
      {
        id: "cozy-loft",
        name: "Cozy Pine Loft",
        price: 890000,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCJOWTTKUqnlyXnXMG84Ecf38vFSqGhGO0JO62sC-OkOqoRssF9O2OBe5VDRB9wwGDElIyTouLF-nPQxt1nUrDjPkHeZ1Tk7EEgadoqlaY82temyACNFdOnn5MPOQDsK0qyweCzY87TAJOM8numIPm-HsRkLB8E6_3h8bkNZyfDo95sKz1diIbhlZokSmoZLqOAxhgWAwRqVxGJx8siY93C0BNIGy3BLYnSKth1c531jJtRNJz_BTB",
        description: "Loteng nyaman berbalut kayu pinus harum dengan tempat tidur empuk, area tempat duduk, dan skylight untuk melihat bintang.",
        amenities: ["Queen Bed", "Skylight", "Espresso Machine", "Bathtub"]
      }
    ]
  },
  {
    id: "tuscan-estate",
    name: "Tuscan Estate Retreat",
    location: "Florence, Italy",
    region: "Italy",
    price: 1450000,
    rating: 5.0,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM5KfIlaw4X5IXxQxfv6uuL5CxkJiFs-kZ55BQiTgx5IGKbLf8E4kqRzhdAGOl2qHIngUc_WK0i_CNAlUHR5bCfn2u87anyHvpc7R4k77JbAVrX-SdR0UeQMvidawM3IvhYAIv4lwnClisTT6me-BKczX1BNzCGNQJ7mvTGC1DXFnx4Df7-DM0r2fv9qS2sT0-oJI5hdzuE_2Mk7y8KvawNCjHam62shmFtWyUd-K4e0FOn05AOCl3",
    description: "Vila bersejarah abad ke-16 yang direstorasi dengan indah di perbukitan Tuscany, dikelilingi kebun anggur dan zaitun yang luas. Menawarkan halaman tengah klasik, masakan chef pribadi, dan kolam renang berpemanas.",
    amenities: ["Vineyard", "Chef Pribadi", "Wi-Fi", "Kolam Renang", "Tur Anggur"],
    rooms: [
      {
        id: "tuscan-suite",
        name: "Historical Grand Suite",
        price: 1450000,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM5KfIlaw4X5IXxQxfv6uuL5CxkJiFs-kZ55BQiTgx5IGKbLf8E4kqRzhdAGOl2qHIngUc_WK0i_CNAlUHR5bCfn2u87anyHvpc7R4k77JbAVrX-SdR0UeQMvidawM3IvhYAIv4lwnClisTT6me-BKczX1BNzCGNQJ7mvTGC1DXFnx4Df7-DM0r2fv9qS2sT0-oJI5hdzuE_2Mk7y8KvawNCjHam62shmFtWyUd-K4e0FOn05AOCl3",
        description: "Suite seluas 90m² dengan lukisan dinding langit-langit asli, perabotan antik Tuscan, tempat tidur poster empat tiang, dan pemandangan lembah Tuscany.",
        amenities: ["King Bed", "Frescoes ceilings", "Historical Furniture", "Valley View"]
      }
    ]
  },
  {
    id: "serenity-cliffside",
    name: "Villa Serenity Cliffside",
    location: "Uluwatu, Bali, Indonesia",
    region: "Bali",
    price: 1850000,
    rating: 4.98,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmOlrqemplpAPeXCYxIfMLmhTyD6eRePYGJeoUYBCS6Jbi9BealEUrS20Vb4wUB8Y7P5_g6abCGI-bMjAvwQl3IoWGTsHqTLNPedeATH4NuElyEUvckR32b2X-nmBmMX89xoQPaykP9v3uBifbh7O5-2iyXgASYPVfomj3fuOULPiAaUx_toUeE4HzG7_9MO-pBZ8IVPvHIRwOziCr5nUc82rF4lzGJ74jQJI30fHoJiKvpBWHj-Ns",
    description: "Villa ultra-mewah yang bertengger di tebing tinggi Uluwatu, menawarkan pemandangan Samudra Hindia 180 derajat yang tiada tandingannya. Desain bergaya tropis minimalis modern dengan kolam renang infinity luas yang seolah menyatu dengan cakrawala.",
    amenities: ["Infinity Pool", "Ocean View", "Wi-Fi", "Cinema Room", "Gym", "Private Bar"],
    rooms: [
      {
        id: "master-suite",
        name: "Master Suite - Ocean View",
        price: 1850000,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCJOWTTKUqnlyXnXMG84Ecf38vFSqGhGO0JO62sC-OkOqoRssF9O2OBe5VDRB9wwGDElIyTouLF-nPQxt1nUrDjPkHeZ1Tk7EEgadoqlaY82temyACNFdOnn5MPOQDsK0qyweCzY87TAJOM8numIPm-HsRkLB8E6_3h8bkNZyfDo95sKz1diIbhlZokSmoZLqOAxhgWAwRqVxGJx8siY93C0BNIGy3BLYnSKth1c531jJtRNJz_BTB",
        description: "Rasakan kemewahan tiada tara di Master Suite kami. Dengan luas ruangan 55m², kamar ini dirancang khusus untuk kenyamanan maksimal dan privasi. Nikmati pemandangan laut lepas yang memukau langsung dari tempat tidur Anda atau saat bersantai di balkon pribadi.",
        amenities: ["King Size Bed", "AC Sentral", "Smart TV 55\"", "Meja Kerja Eksekutif", "Balkon Pribadi", "Bathtub Laut"]
      },
      {
        id: "cliff-villa",
        name: "Cliff Edge Villa Suite",
        price: 1550000,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBsc5jf1_kaXY_cBC2FjtybWt36Y6otnwwFTG-mVetccMP0id9p14q2aOSPH_evhzlsgrsjALLRzEhv_vlZqAcNs7hh19BAf0Lzw1FPa-Oi7rJ35k0OjobgUkhS81SyxzNK8P1k7Pur0G5H2NUtE9L5sXXc1tXXJxivrhrdGOBYWn7jOBKY4uIncKxJFxEv67qiN6qMXWUIpW8RZdLv9I5Px51DnqLEXkOytpwyMuG22wTSfbvxBY0D",
        description: "Kamar suite eksklusif tepat di tepi tebing dengan akses teras pribadi, kursi berjemur berkelas, dan jacuzzi air hangat pribadi.",
        amenities: ["King Bed", "Jacuzzi Pribadi", "Teras Tebing", "Outdoor Lounge"]
      }
    ]
  }
];

const STORAGE_KEYS = {
  properties: "nus4stay_properties",
  destinations: "nus4stay_destinations",
  bookings: "nus4stay_bookings"
};

const LEGACY_STORAGE_PREFIX = "luxe" + "stay";
const LEGACY_STORAGE_KEYS = {
  properties: `${LEGACY_STORAGE_PREFIX}_properties`,
  destinations: `${LEGACY_STORAGE_PREFIX}_destinations`,
  bookings: `${LEGACY_STORAGE_PREFIX}_bookings`
};

const migrateLegacyStorage = () => {
  Object.entries(STORAGE_KEYS).forEach(([key, value]) => {
    const legacyValue = localStorage.getItem(LEGACY_STORAGE_KEYS[key]);

    if (!localStorage.getItem(value) && legacyValue) {
      localStorage.setItem(value, legacyValue);
    }
  });
};

// Initialize storage if empty
const initStorage = () => {
  migrateLegacyStorage();

  if (!localStorage.getItem(STORAGE_KEYS.properties)) {
    localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(MOCK_PROPERTIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.destinations)) {
    localStorage.setItem(STORAGE_KEYS.destinations, JSON.stringify(MOCK_DESTINATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.bookings)) {
    // Initial booking to show in history (N4-8492-ST)
    const initialBookings = [
      {
        id: "N4-8492-ST",
        propertyId: "serenity-cliffside",
        propertyName: "Villa Serenity Cliffside",
        propertyLocation: "Uluwatu, Bali, Indonesia",
        propertyImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmOlrqemplpAPeXCYxIfMLmhTyD6eRePYGJeoUYBCS6Jbi9BealEUrS20Vb4wUB8Y7P5_g6abCGI-bMjAvwQl3IoWGTsHqTLNPedeATH4NuElyEUvckR32b2X-nmBmMX89xoQPaykP9v3uBifbh7O5-2iyXgASYPVfomj3fuOULPiAaUx_toUeE4HzG7_9MO-pBZ8IVPvHIRwOziCr5nUc82rF4lzGJ74jQJI30fHoJiKvpBWHj-Ns",
        roomId: "master-suite",
        roomName: "Master Suite - Ocean View",
        checkIn: "2024-10-15",
        checkOut: "2024-10-18",
        guests: "2 Dewasa",
        guestName: "John Doe",
        guestEmail: "john.doe@example.com",
        guestPhone: "+62 812 3456 7890",
        totalPrice: 5545000,
        status: "Confirmed", // Initial historical booking
        createdAt: new Date(2024, 9, 1).toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(initialBookings));
  }
};

initStorage();

export const db = {
  getDestinations: async () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.destinations));
  },

  getProperties: async (filters = {}) => {
    let properties = JSON.parse(localStorage.getItem(STORAGE_KEYS.properties));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      properties = properties.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.location.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q)
      );
    }

    if (filters.region) {
      properties = properties.filter(p => 
        p.region.toLowerCase() === filters.region.toLowerCase()
      );
    }

    if (filters.maxPrice) {
      properties = properties.filter(p => p.price <= filters.maxPrice);
    }

    if (filters.minRating) {
      properties = properties.filter(p => p.rating >= filters.minRating);
    }

    if (filters.amenities && filters.amenities.length > 0) {
      properties = properties.filter(p => 
        filters.amenities.every(amenity => p.amenities.includes(amenity))
      );
    }

    return properties;
  },

  getPropertyById: async (id) => {
    const properties = JSON.parse(localStorage.getItem(STORAGE_KEYS.properties));
    return properties.find(p => p.id === id) || null;
  },

  getBookingHistory: async () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings)) || [];
  },

  getBookingById: async (id) => {
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings)) || [];
    return bookings.find(b => b.id === id) || null;
  },

  createBooking: async (bookingData) => {
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings)) || [];
    const prefix = "N4-" + Math.floor(1000 + Math.random() * 9000);
    const suffix = ["ST", "AZ", "AV", "TE"][Math.floor(Math.random() * 4)];
    const id = `${prefix}-${suffix}`;
    
    const newBooking = {
      id,
      ...bookingData,
      status: "Pending", // Always starts as Pending for countdown
      createdAt: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
    return newBooking;
  },

  updateBookingStatus: async (id, status) => {
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings)) || [];
    const idx = bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      bookings[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
      return bookings[idx];
    }
    return null;
  }
};
