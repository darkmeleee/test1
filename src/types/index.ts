export interface Flower {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
  attributes: string[]; // JSON parsed array
  inStock: boolean;
  deliveryNextDay: boolean;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  type: "MAIN" | "ATTRIBUTE";
}

export interface CartItem {
  id: string;
  userId: string;
  flowerId: string;
  quantity: number;
  flower?: Flower;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED";
  deliveryAddress?: string;
  phoneNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  flowerId: string;
  quantity: number;
  price: number;
  flower?: Flower;
  createdAt: Date;
}

export interface User {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
  photoUrl?: string | null;
  isAdmin?: boolean;
}

export interface FilterState {
  selectedCategory: string;
  selectedAttributes: string[];
}
