import { ShoppingCart, Plus, Minus } from "lucide-react";
import type { Flower, CartItem } from "~/types";

interface FlowerGridProps {
  flowers: Flower[];
  onAddToCart: (flower: Flower) => void;
  cartItems: CartItem[];
}

export default function FlowerGrid({ flowers, onAddToCart, cartItems }: FlowerGridProps) {
  const getCartItemQuantity = (flowerId: string) => {
    const item = cartItems.find(item => item.flowerId === flowerId);
    return item?.quantity || 0;
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {flowers.map((flower) => {
        const quantity = getCartItemQuantity(flower.id);
        
        return (
          <div
            key={flower.id}
            className="rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-ink-800"
          >
            {/* Image */}
            <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-brand-100 dark:bg-ink-700">
              <img
                src={flower.image}
                alt={flower.name}
                className="h-full w-full object-cover"
              />
              
              {/* Delivery Badge */}
              {flower.deliveryNextDay && (
                <div className="absolute left-2 top-2 rounded bg-brand-600 px-2 py-1 text-xs text-white">
                  Сделаем на заказ
                </div>
              )}

              {/* Stock Status */}
              {!flower.inStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="rounded bg-red-600 px-3 py-1 text-sm text-white">
                    Нет в наличии
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-2">
              <h3 className="font-medium text-ink-900 dark:text-white line-clamp-2">
                {flower.name}
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-brand-700 dark:text-brand-300">
                  {flower.price} ₽
                </div>
                
                {/* Cart Controls */}
                {flower.inStock && (
                  <div className="flex items-center space-x-1">
                    {quantity > 0 ? (
                      <div className="flex items-center space-x-1 rounded bg-brand-600 px-2 py-1">
                        <button
                          onClick={() => {
                            // Decrease quantity
                            const newQuantity = quantity - 1;
                            if (newQuantity === 0) {
                              // Remove from cart
                              onAddToCart(flower);
                            } else {
                              // Update quantity (would need API call)
                            }
                          }}
                          className="text-white hover:bg-brand-700 rounded p-1"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium text-white px-1">
                          {quantity}
                        </span>
                        <button
                          onClick={() => onAddToCart(flower)}
                          className="text-white hover:bg-brand-700 rounded p-1"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddToCart(flower)}
                        className="rounded bg-brand-600 p-2 text-white hover:bg-brand-700 transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
