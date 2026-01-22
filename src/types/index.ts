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

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
}

export interface FilterState {
  selectedCategory: string;
  selectedAttributes: string[];
}
