export function getRouteInfo(currentRoute) {
  const path = currentRoute.split('?')[0];

  if (path.startsWith('#/detail/')) {
    return { page: 'detail', showNav: true, showFooter: true };
  }
  if (path.startsWith('#/room/')) {
    return { page: 'room', showNav: true, showFooter: true };
  }
  if (path.startsWith('#/checkout/')) {
    return { page: 'checkout', showNav: true, showFooter: false };
  }
  if (path.startsWith('#/pending/')) {
    return { page: 'pending', showNav: false, showFooter: false };
  }
  if (path.startsWith('#/history-detail/')) {
    return { page: 'history-detail', showNav: false, showFooter: true };
  }
  if (path === '#/login') {
    return { page: 'login', showNav: true, showFooter: false };
  }
  if (path === '#/history') {
    return { page: 'history', showNav: true, showFooter: true };
  }
  if (path.startsWith('#/search')) {
    return { page: 'search', showNav: true, showFooter: true };
  }
  return { page: 'landing', showNav: true, showFooter: true };
}
