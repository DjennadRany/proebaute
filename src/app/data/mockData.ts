// Mock data for the beauty marketplace application

export interface User {
  _id: string;
  role: 'client' | 'professional';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface ProfessionalProfile {
  _id: string;
  userId: string;
  professionalName: string;
  specialty: string;
  bio: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  servicesIds: string[];
  gallery: string[];
  ratingAverage: number;
  reviewsCount: number;
  verified: boolean;
}

export interface Service {
  _id: string;
  professionalId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  media: string[];
  ratingAverage: number;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
}

export interface Booking {
  _id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  bookingDate: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  service?: Service;
  professional?: ProfessionalProfile;
}

export interface Review {
  _id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  rating: number;
  comment: string;
  createdAt: string;
  clientName: string;
  clientAvatar?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  readStatus: boolean;
}

export interface Conversation {
  _id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: string;
  otherUser: {
    name: string;
    avatar?: string;
    role: string;
  };
  unreadCount: number;
}

// Mock current user
export const currentUser: User = {
  _id: '1',
  role: 'client',
  firstName: 'Sophie',
  lastName: 'Martin',
  email: 'sophie.martin@example.com',
  phone: '+33 6 12 34 56 78',
};

// Mock professionals
export const mockProfessionals: ProfessionalProfile[] = [
  {
    _id: 'p1',
    userId: 'u1',
    professionalName: 'Amélie Rousseau',
    specialty: 'Hair Stylist & Colorist',
    bio: 'Passionnée par la coiffure depuis 15 ans, spécialisée dans les colorations et les coupes tendance inspirées de la Fashion Week.',
    location: 'Paris 8ème, France',
    coordinates: { lat: 48.8738, lng: 2.3158 },
    servicesIds: ['s1', 's2', 's3'],
    gallery: [],
    ratingAverage: 4.9,
    reviewsCount: 127,
    verified: true,
  },
  {
    _id: 'p2',
    userId: 'u2',
    professionalName: 'Léa Dubois',
    specialty: 'Esthetician & Spa Specialist',
    bio: 'Esthéticienne diplômée, je propose des soins du visage personnalisés avec des produits bio et naturels.',
    location: 'Paris 16ème, France',
    coordinates: { lat: 48.8647, lng: 2.2755 },
    servicesIds: ['s4', 's5'],
    gallery: [],
    ratingAverage: 4.8,
    reviewsCount: 89,
    verified: true,
  },
  {
    _id: 'p3',
    userId: 'u3',
    professionalName: 'Camille Laurent',
    specialty: 'Nail Artist',
    bio: 'Nail art créatif et manucure de luxe. Spécialisée dans les designs uniques et les extensions.',
    location: 'Paris 9ème, France',
    coordinates: { lat: 48.8766, lng: 2.3386 },
    servicesIds: ['s6', 's7'],
    gallery: [],
    ratingAverage: 5.0,
    reviewsCount: 203,
    verified: true,
  },
  {
    _id: 'p4',
    userId: 'u4',
    professionalName: 'Emma Bernard',
    specialty: 'Makeup Artist',
    bio: 'Maquilleuse professionnelle pour événements, mariages et shooting photo. Formation aux techniques des défilés parisiens.',
    location: 'Paris 7ème, France',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    servicesIds: ['s8', 's9'],
    gallery: [],
    ratingAverage: 4.9,
    reviewsCount: 156,
    verified: true,
  },
];

// Mock services
export const mockServices: Service[] = [
  {
    _id: 's1',
    professionalId: 'p1',
    title: 'Balayage Premium',
    description: 'Coloration technique balayage pour un effet naturel et lumineux. Produits haut de gamme.',
    category: 'Hair Coloring',
    price: 180,
    duration: 180,
    media: ['https://images.unsplash.com/photo-1706629503603-e47c37722776?w=600'],
    ratingAverage: 4.9,
    likesCount: 342,
    commentsCount: 45,
    isLiked: false,
    isFavorited: false,
  },
  {
    _id: 's2',
    professionalId: 'p1',
    title: 'Coupe & Brushing',
    description: 'Coupe personnalisée avec brushing professionnel. Consultation style incluse.',
    category: 'Haircut',
    price: 85,
    duration: 90,
    media: ['https://images.unsplash.com/photo-1511920593290-3cb2deb1ce1c?w=600'],
    ratingAverage: 4.8,
    likesCount: 234,
    commentsCount: 28,
  },
  {
    _id: 's3',
    professionalId: 'p1',
    title: 'Soin Capillaire Luxe',
    description: 'Soin réparateur profond avec massage du cuir chevelu. Produits Kérastase.',
    category: 'Hair Treatment',
    price: 95,
    duration: 60,
    media: ['https://images.unsplash.com/photo-1763048208932-cbe149724374?w=600'],
    ratingAverage: 5.0,
    likesCount: 189,
    commentsCount: 19,
  },
  {
    _id: 's4',
    professionalId: 'p2',
    title: 'Soin Visage Anti-Âge',
    description: 'Soin complet du visage avec protocole anti-âge. Massage facial inclus.',
    category: 'Facial',
    price: 120,
    duration: 75,
    media: ['https://images.unsplash.com/photo-1722350766824-f8520e9676ac?w=600'],
    ratingAverage: 4.9,
    likesCount: 267,
    commentsCount: 34,
    isFavorited: true,
  },
  {
    _id: 's5',
    professionalId: 'p2',
    title: 'Épilation Complète',
    description: 'Épilation professionnelle avec cire végétale. Technique douce et précise.',
    category: 'Waxing',
    price: 75,
    duration: 60,
    media: ['https://images.unsplash.com/photo-1722350766824-f8520e9676ac?w=600'],
    ratingAverage: 4.7,
    likesCount: 145,
    commentsCount: 12,
  },
  {
    _id: 's6',
    professionalId: 'p3',
    title: 'Manucure Gel Premium',
    description: 'Pose de vernis semi-permanent avec design personnalisé. Tenue 3 semaines.',
    category: 'Nails',
    price: 65,
    duration: 90,
    media: ['https://images.unsplash.com/photo-1650176491728-a5e6edd08575?w=600'],
    ratingAverage: 5.0,
    likesCount: 456,
    commentsCount: 67,
    isLiked: true,
  },
  {
    _id: 's7',
    professionalId: 'p3',
    title: 'Nail Art Créatif',
    description: 'Design nail art unique et personnalisé. Techniques avancées et strass.',
    category: 'Nails',
    price: 95,
    duration: 120,
    media: ['https://images.unsplash.com/photo-1637777277337-f114350fb088?w=600'],
    ratingAverage: 5.0,
    likesCount: 589,
    commentsCount: 89,
  },
  {
    _id: 's8',
    professionalId: 'p4',
    title: 'Maquillage Soirée',
    description: 'Maquillage élégant pour soirée ou événement. Look sophistiqué garanti.',
    category: 'Makeup',
    price: 110,
    duration: 60,
    media: ['https://images.unsplash.com/photo-1600637070413-0798fafbb6c7?w=600'],
    ratingAverage: 4.9,
    likesCount: 312,
    commentsCount: 41,
  },
  {
    _id: 's9',
    professionalId: 'p4',
    title: 'Maquillage Mariée',
    description: 'Maquillage complet de mariée avec essai préalable. Longue tenue garantie.',
    category: 'Makeup',
    price: 250,
    duration: 120,
    media: ['https://images.unsplash.com/photo-1625139108082-48bb424c2333?w=600'],
    ratingAverage: 5.0,
    likesCount: 478,
    commentsCount: 93,
    isFavorited: true,
  },
];

// Mock bookings
export const mockBookings: Booking[] = [
  {
    _id: 'b1',
    clientId: '1',
    professionalId: 'p1',
    serviceId: 's1',
    bookingDate: '2026-03-22',
    timeSlot: '14:00',
    status: 'confirmed',
  },
  {
    _id: 'b2',
    clientId: '1',
    professionalId: 'p3',
    serviceId: 's6',
    bookingDate: '2026-03-18',
    timeSlot: '10:30',
    status: 'confirmed',
  },
  {
    _id: 'b3',
    clientId: '1',
    professionalId: 'p2',
    serviceId: 's4',
    bookingDate: '2026-03-10',
    timeSlot: '16:00',
    status: 'completed',
  },
];

// Mock reviews
export const mockReviews: Review[] = [
  {
    _id: 'r1',
    clientId: 'c1',
    professionalId: 'p1',
    serviceId: 's1',
    rating: 5,
    comment: 'Résultat magnifique ! Amélie est vraiment à l\'écoute et très professionnelle. Le balayage est exactement ce que je voulais.',
    createdAt: '2026-02-28',
    clientName: 'Marie L.',
    clientAvatar: '',
  },
  {
    _id: 'r2',
    clientId: 'c2',
    professionalId: 'p1',
    serviceId: 's2',
    rating: 5,
    comment: 'Coupe parfaite, j\'adore ! L\'ambiance du salon est très agréable.',
    createdAt: '2026-03-05',
    clientName: 'Julie M.',
  },
  {
    _id: 'r3',
    clientId: 'c3',
    professionalId: 'p3',
    serviceId: 's6',
    rating: 5,
    comment: 'Camille est une vraie artiste ! Mes ongles sont sublimes et tiennent vraiment 3 semaines.',
    createdAt: '2026-03-08',
    clientName: 'Anaïs P.',
  },
  {
    _id: 'r4',
    clientId: 'c4',
    professionalId: 'p2',
    serviceId: 's4',
    rating: 5,
    comment: 'Soin visage incroyable, ma peau est lumineuse ! Je recommande vivement.',
    createdAt: '2026-03-12',
    clientName: 'Clara D.',
  },
];

// Mock conversations
export const mockConversations: Conversation[] = [
  {
    _id: 'conv1',
    participants: ['1', 'p1'],
    lastMessage: 'Parfait, à samedi alors ! 😊',
    updatedAt: '2026-03-14T18:45:00',
    otherUser: {
      name: 'Amélie Rousseau',
      avatar: '',
      role: 'Hair Stylist',
    },
    unreadCount: 0,
  },
  {
    _id: 'conv2',
    participants: ['1', 'p3'],
    lastMessage: 'Oui, je peux vous proposer un créneau mardi à 10h30',
    updatedAt: '2026-03-15T10:23:00',
    otherUser: {
      name: 'Camille Laurent',
      avatar: '',
      role: 'Nail Artist',
    },
    unreadCount: 1,
  },
];

// Mock messages
export const mockMessages: Message[] = [
  {
    _id: 'm1',
    conversationId: 'conv1',
    senderId: '1',
    receiverId: 'p1',
    content: 'Bonjour, est-il possible de modifier mon rdv de samedi ?',
    createdAt: '2026-03-14T17:30:00',
    readStatus: true,
  },
  {
    _id: 'm2',
    conversationId: 'conv1',
    senderId: 'p1',
    receiverId: '1',
    content: 'Bonjour Sophie ! Bien sûr, à quelle heure préféreriez-vous venir ?',
    createdAt: '2026-03-14T17:45:00',
    readStatus: true,
  },
  {
    _id: 'm3',
    conversationId: 'conv1',
    senderId: '1',
    receiverId: 'p1',
    content: 'Plutôt en début d\'après-midi si possible',
    createdAt: '2026-03-14T18:12:00',
    readStatus: true,
  },
  {
    _id: 'm4',
    conversationId: 'conv1',
    senderId: 'p1',
    receiverId: '1',
    content: 'Parfait, à samedi alors ! 😊',
    createdAt: '2026-03-14T18:45:00',
    readStatus: true,
  },
];

// Helper functions
export function getProfessionalById(id: string): ProfessionalProfile | undefined {
  return mockProfessionals.find(p => p._id === id);
}

export function getServiceById(id: string): Service | undefined {
  return mockServices.find(s => s._id === id);
}

export function getServicesByProfessional(professionalId: string): Service[] {
  return mockServices.filter(s => s.professionalId === professionalId);
}

export function getReviewsByProfessional(professionalId: string): Review[] {
  return mockReviews.filter(r => r.professionalId === professionalId);
}