const routes = [
  { pattern: /^#\/detail\//,              page: 'detail',          showNav: true,  showFooter: true, protected: false, roles: [] },
  { pattern: /^#\/room\//,                page: 'room',            showNav: true,  showFooter: true, protected: false, roles: [] },
  { pattern: /^#\/checkout\//,            page: 'checkout',        showNav: true,  showFooter: false, protected: true, roles: ['guest', 'admin'] },
  { pattern: /^#\/pending\//,             page: 'pending',         showNav: false, showFooter: false, protected: true, roles: ['guest'] },
  { pattern: /^#\/history-detail\//,      page: 'history-detail',  showNav: false, showFooter: true, protected: true, roles: ['guest'] },
  { pattern: /^#\/login$/,                page: 'login',           showNav: true,  showFooter: false, protected: false, roles: [] },
  { pattern: /^#\/history$/,              page: 'history',         showNav: true,  showFooter: true, protected: true, roles: ['guest'] },
  { pattern: /^#\/search/,                page: 'search',          showNav: true,  showFooter: true, protected: false, roles: [] },
  { pattern: /^#\/profile$/,                      page: 'profile',         showNav: true,  showFooter: true, protected: true,  roles: ['guest', 'admin'] },
  { pattern: /^#\/admin\/properties$/,    page: 'admin-properties',showNav: true,  showFooter: true, protected: true, roles: ['admin'] },
  { pattern: /^#\/admin\/payments$/,      page: 'admin-payments',  showNav: true,  showFooter: true, protected: true, roles: ['admin'] },
];

export function getRouteInfo(currentRoute) {
  const path = currentRoute.split('?')[0];
  for (const route of routes) {
    if (route.pattern.test(path)) {
      return { ...route };
    }
  }
  return { page: 'landing', showNav: true, showFooter: true, protected: false };
}
