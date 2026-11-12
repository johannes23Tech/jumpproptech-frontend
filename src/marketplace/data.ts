export type ListingCategory = 'Residential' | 'Commercial' | 'Industrial' | 'Agricultural' | 'Land';
export type ListingIntent = 'Rent' | 'Sale';

export type PropertyListing = {
  id: string;
  title: string;
  suburb: string;
  city: string;
  price: number;
  intent: ListingIntent;
  category: ListingCategory;
  beds: number;
  baths: number;
  area: number;
  image: string;
  imageAlt: string;
  verified: boolean;
  checked: string;
  age: string;
  description: string;
  amenities: string[];
  agent: {
    name: string;
    agency: string;
    initials: string;
    response: string;
    rating: string;
  };
};

export const propertyListings: PropertyListing[] = [
  {
    id: 'sea-point-apartment',
    title: 'Light-filled apartment near the promenade',
    suburb: 'Sea Point',
    city: 'Cape Town',
    price: 18500,
    intent: 'Rent',
    category: 'Residential',
    beds: 2,
    baths: 1,
    area: 78,
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Sunlit contemporary apartment living room with warm neutral furniture',
    verified: true,
    checked: 'Checked 2 days ago',
    age: 'Updated recently',
    description: 'A calm, light-filled home a short walk from the Sea Point promenade, with an open-plan living area and a sheltered balcony.',
    amenities: ['Balcony', 'Secure parking', 'Fibre-ready', 'Pet friendly', '24-hour security'],
    agent: { name: 'Amahle Ndlovu', agency: 'Harbour & Home', initials: 'AN', response: 'Usually replies in 20 min', rating: '4.9' },
  },
  {
    id: 'gardens-cottage',
    title: 'Quiet garden cottage with a private patio',
    suburb: 'Gardens',
    city: 'Cape Town',
    price: 12500,
    intent: 'Rent',
    category: 'Residential',
    beds: 1,
    baths: 1,
    area: 54,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Modern compact home opening onto a leafy private garden',
    verified: true,
    checked: 'Checked yesterday',
    age: 'New this week',
    description: 'A tucked-away cottage with a private garden, natural light and easy access to cafes, parks and the city bowl.',
    amenities: ['Private patio', 'Built-in cupboards', 'Fibre-ready', 'Water included'],
    agent: { name: 'Sipho Jacobs', agency: 'Cape Nest Realty', initials: 'SJ', response: 'Usually replies in 1 hour', rating: '4.8' },
  },
  {
    id: 'woodstock-loft',
    title: 'Creative city loft in a restored warehouse',
    suburb: 'Woodstock',
    city: 'Cape Town',
    price: 24500,
    intent: 'Rent',
    category: 'Residential',
    beds: 2,
    baths: 2,
    area: 112,
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Spacious modern loft with textured walls and large windows',
    verified: false,
    checked: 'Listed 5 days ago',
    age: 'Popular this week',
    description: 'A generous loft with a flexible second room and neighbourhood food spots right outside.',
    amenities: ['High ceilings', 'Secure access', 'Two bathrooms', 'Covered parking'],
    agent: { name: 'Mila Petersen', agency: 'Cityline Property', initials: 'MP', response: 'Usually replies in 2 hours', rating: '4.7' },
  },
  {
    id: 'claremont-home',
    title: 'Family home with a sunny north-facing garden',
    suburb: 'Claremont',
    city: 'Cape Town',
    price: 3490000,
    intent: 'Sale',
    category: 'Residential',
    beds: 3,
    baths: 2,
    area: 164,
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Bright family home with a landscaped garden and wide windows',
    verified: true,
    checked: 'Checked 1 day ago',
    age: 'New this week',
    description: 'An easy-living family home with garden space, a covered patio and quick access to schools and transport.',
    amenities: ['Garden', 'Covered patio', 'Alarm', 'Two parking bays', 'Solar geyser'],
    agent: { name: 'Amahle Ndlovu', agency: 'Harbour & Home', initials: 'AN', response: 'Usually replies in 20 min', rating: '4.9' },
  },
  {
    id: 'stellenbosch-farm',
    title: 'Vineyard-side smallholding with mountain views',
    suburb: 'Stellenbosch Farms',
    city: 'Stellenbosch',
    price: 6200000,
    intent: 'Sale',
    category: 'Agricultural',
    beds: 4,
    baths: 3,
    area: 280,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Country home with mountain views and broad green grounds',
    verified: true,
    checked: 'Checked 3 days ago',
    age: 'Updated recently',
    description: 'A spacious country home with established gardens, open skies and room to shape a smallholding lifestyle.',
    amenities: ['Mountain views', 'Borehole', 'Guest suite', 'Solar power', 'Double garage'],
    agent: { name: 'Sipho Jacobs', agency: 'Cape Nest Realty', initials: 'SJ', response: 'Usually replies in 1 hour', rating: '4.8' },
  },
];

export const categories: { name: ListingCategory; icon: string }[] = [
  { name: 'Residential', icon: '⌂' },
  { name: 'Commercial', icon: '▥' },
  { name: 'Industrial', icon: '▤' },
  { name: 'Agricultural', icon: '♧' },
  { name: 'Land', icon: '⌁' },
];

export const formatZar = (amount: number) => `R${new Intl.NumberFormat('en-ZA').format(amount)}`;
