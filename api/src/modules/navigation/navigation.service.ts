export const getNavigationForRole = (role?: 'CUSTOMER' | 'PROVIDER' | 'ADMIN') => {
  const publicItems = [
    { label: 'Services', path: '/services' },
    { label: 'Providers', path: '/providers' },
    { label: 'Categories', path: '/categories' },
  ];

  if (role === 'CUSTOMER') {
    return [...publicItems, { label: 'My Bookings', path: '/bookings/me' }, { label: 'Requests', path: '/requests' }];
  }

  if (role === 'PROVIDER') {
    return [...publicItems, { label: 'My Services', path: '/services' }, { label: 'Availability', path: '/availability/me' }];
  }

  if (role === 'ADMIN') {
    return [...publicItems, { label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Reports', path: '/reports' }];
  }

  return publicItems;
};

export const buildProviderDirections = (provider: {
  businessName: string;
  address?: string;
  location?: { coordinates: [number, number] };
}) => {
  const query = provider.location
    ? `${provider.location.coordinates[1]},${provider.location.coordinates[0]}`
    : encodeURIComponent(provider.address ?? provider.businessName);

  return {
    label: provider.businessName,
    address: provider.address ?? '',
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${query}`,
  };
};
