export type Language = 'en' | 'el';

interface Translations {
  [key: string]: {
    en: string;
    el: string;
  };
}

export const translations: Translations = {
  welcome: {
    en: 'Welcome to Power Search',
    el: 'Καλώς ήρθες στο Power Search, Γιώργο'
  },
  search: {
    en: 'Search',
    el: 'Αναζήτηση'
  },
  searchPlaceholder: {
    en: 'What are you looking for?',
    el: 'Τι ψάχνεις;'
  },
  findBestDeals: {
    en: 'Find Best Deals',
    el: 'Βρες τις καλύτερες προσφορές'
  },
  bestDealsFound: {
    en: 'Best Deals Found',
    el: 'Οι καλύτερες προσφορές'
  },
  allProducts: {
    en: 'All Products',
    el: 'Όλα τα προϊόντα'
  },
  favorites: {
    en: 'Favorites',
    el: 'Αγαπημένα'
  },
  history: {
    en: 'History',
    el: 'Ιστορικό'
  },
  priceRange: {
    en: 'Price Range',
    el: 'Εύρος τιμών'
  },
  sortBy: {
    en: 'Sort By',
    el: 'Ταξινόμηση κατά'
  },
  region: {
    en: 'Region',
    el: 'Περιοχή'
  },
  viewDeal: {
    en: 'View Deal',
    el: 'Δες την προσφορά'
  },
  noResults: {
    en: 'No products found matching your search criteria. Try adjusting your filters or search terms.',
    el: 'Δεν βρέθηκαν προϊόντα που να ταιριάζουν με τα κριτήρια αναζήτησής σας. Δοκιμάστε να προσαρμόσετε τα φίλτρα ή τους όρους αναζήτησης.'
  },
  freeShipping: {
    en: 'FREE SHIPPING',
    el: 'ΔΩΡΕΑΝ ΑΠΟΣΤΟΛΗ'
  },
  rating: {
    en: 'Rating',
    el: 'Βαθμολογία'
  },
  reviews: {
    en: 'reviews',
    el: 'κριτικές'
  },
  shipping: {
    en: 'Shipping',
    el: 'Αποστολή'
  }
};

export const getTranslation = (key: string, language: Language = 'en'): string => {
  if (!translations[key]) {
    console.warn(`Translation key "${key}" not found`);
    return key;
  }
  return translations[key][language] || translations[key].en;
}; 