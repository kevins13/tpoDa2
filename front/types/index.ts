export type UserCategory = 'común' | 'especial' | 'plata' | 'oro' | 'platino';

export type AuctionCategory = 'común' | 'especial' | 'plata' | 'oro' | 'platino';

export type Currency = 'ARS' | 'USD';

export type PaymentMethodType = 'bank_account' | 'credit_card' | 'certified_check';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  verified: boolean;
  details: string;
  amount?: number; // For certified checks
}

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  category: UserCategory;
  country: string;
  address: string;
  documentFront?: string;
  documentBack?: string;
  paymentMethods: PaymentMethod[];
  isApproved: boolean;
}

export interface AuctionItem {
  id: string;
  itemNumber: string;
  name: string;
  description: string;
  basePrice: number;
  currentBid: number;
  images: string[];
  artist?: string;
  date?: string;
  history?: string;
  ownerId: string;
  sold: boolean;
  winnerId?: string;
}

export interface Auction {
  id: string;
  name: string;
  date: string;
  time: string;
  category: AuctionCategory;
  currency: Currency;
  auctioneer: string;
  location: string;
  status: 'upcoming' | 'active' | 'completed';
  items: AuctionItem[];
  currentItemIndex: number;
}

export interface Bid {
  id: string;
  auctionId: string;
  itemId: string;
  userId: string;
  userName: string;
  amount: number;
  timestamp: Date;
}

export interface ItemSubmission {
  id: string;
  userId: string;
  itemName: string;
  description: string;
  images: string[];
  artistInfo?: string;
  historicalInfo?: string;
  ownershipConfirmed: boolean;
  status: 'pending' | 'inspecting' | 'accepted' | 'rejected';
  rejectionReason?: string;
  basePrice?: number;
  commission?: number;
  auctionDate?: string;
}

export interface UserStats {
  totalAuctions: number;
  totalBids: number;
  itemsWon: number;
  totalSpent: number;
  winRate: number;
}
