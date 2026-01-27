"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hapticImpact } from "~/utils/telegram";
import { useCart } from "~/contexts/CartContext";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import type { CartItem } from "~/types";

import Header from "~/components/Header";
import CartButton from "~/components/CartButton";
import BottomNav from "~/components/BottomNav";

export default function CartPage() {
  const router = useRouter();
  const { user } = useTelegramAuth();
  const { items, removeFromCart, updateQuantity, isLoading } = useCart();

  // Calculate totals
  const cartTotal = items.reduce((sum, item) => sum + (item.flower?.price || 0) * item.quantity, 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdateQuantity = async (flowerId: string, quantity: number) => {
    if (quantity === 0) {
      await removeFromCart(flowerId);
    } else {
      await updateQuantity(flowerId, quantity);
    }
  };

  const handleRemoveItem = async (flowerId: string) => {
    hapticImpact('medium');
    await removeFromCart(flowerId);
  };

  const handleCheckout = () => {
    hapticImpact('heavy');
    router.push("/checkout");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <Header user={null} />
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-lg text-gray-600 dark:text-gray-400">
              Пожалуйста, войдите через Telegram для доступа к корзине
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <Header user={user} />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-lg">Загрузка...</div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Корзина
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Ваша корзина пуста
            </div>
            <button
              onClick={() => router.push("/")}
              className="rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700 transition-colors"
            >
              Перейти к покупкам
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
              >
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                    <img
                      src={item.flower?.image || ""}
                      alt={item.flower?.name || ""}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {item.flower?.name}
                    </h3>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {item.flower?.price} ₽
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.flowerId, item.quantity - 1)}
                      className="rounded bg-gray-200 p-1 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => handleUpdateQuantity(item.flowerId, item.quantity + 1)}
                      className="rounded bg-gray-200 p-1 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleRemoveItem(item.flowerId)}
                      className="ml-2 rounded bg-red-100 p-1 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Item Total */}
                <div className="mt-2 text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Сумма: {(item.flower?.price || 0) * item.quantity} ₽
                  </div>
                </div>
              </div>
            ))}

            {/* Cart Summary */}
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Итого:
                  </span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {cartTotal} ₽
                  </span>
                </div>
                
                <button
                  onClick={handleCheckout}
                  className="w-full rounded bg-green-600 py-3 text-white font-medium hover:bg-green-700 transition-colors"
                >
                  Оформить заказ
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
