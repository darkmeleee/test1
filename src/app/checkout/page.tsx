"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hapticImpact } from "~/utils/telegram";
import { useCart } from "~/contexts/CartContext";
import { useOrder } from "~/contexts/OrderContext";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";

import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useTelegramAuth();
  const { items: cartItems, isLoading } = useCart();
  const { createOrder } = useOrder();
  
  // Form state
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [apartment, setApartment] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [orderComment, setOrderComment] = useState("");

  const [isRecipientCustomer, setIsRecipientCustomer] = useState(true);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const [customerPhoneError, setCustomerPhoneError] = useState<string | null>(null);
  const [customerEmailError, setCustomerEmailError] = useState<string | null>(null);
  const [streetError, setStreetError] = useState<string | null>(null);
  const [houseError, setHouseError] = useState<string | null>(null);
  const [deliveryDateError, setDeliveryDateError] = useState<string | null>(null);
  const [deliveryTimeError, setDeliveryTimeError] = useState<string | null>(null);
  const [recipientNameError, setRecipientNameError] = useState<string | null>(null);
  const [recipientPhoneError, setRecipientPhoneError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length === 0) {
      return "Введите номер телефона";
    }

    if (digits.length !== 11) {
      return "Номер телефона должен содержать 11 цифр";
    }

    if (digits[0] !== "7" && digits[0] !== "8") {
      return "Номер должен начинаться с 7 или 8";
    }

    return null;
  };

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "Введите email";
    }
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    return isValid ? null : "Введите корректный email";
  };

  const validateRequired = (value: string, message: string) => {
    return value.trim().length === 0 ? message : null;
  };

  const validateForm = () => {
    const nextCustomerPhoneError = validatePhoneNumber(customerPhone);
    const nextCustomerEmailError = validateEmail(customerEmail);
    const nextStreetError = validateRequired(street, "Укажите улицу");
    const nextHouseError = validateRequired(house, "Укажите дом");
    const nextDeliveryDateError = validateRequired(deliveryDate, "Укажите дату доставки");
    const nextDeliveryTimeError = validateRequired(deliveryTime, "Укажите время доставки");

    const nextRecipientNameError = isRecipientCustomer
      ? null
      : validateRequired(recipientName, "Укажите имя получателя");
    const nextRecipientPhoneError = isRecipientCustomer
      ? null
      : validatePhoneNumber(recipientPhone);

    setCustomerPhoneError(nextCustomerPhoneError);
    setCustomerEmailError(nextCustomerEmailError);
    setStreetError(nextStreetError);
    setHouseError(nextHouseError);
    setDeliveryDateError(nextDeliveryDateError);
    setDeliveryTimeError(nextDeliveryTimeError);
    setRecipientNameError(nextRecipientNameError);
    setRecipientPhoneError(nextRecipientPhoneError);

    return !(
      nextCustomerPhoneError ||
      nextCustomerEmailError ||
      nextStreetError ||
      nextHouseError ||
      nextDeliveryDateError ||
      nextDeliveryTimeError ||
      nextRecipientNameError ||
      nextRecipientPhoneError
    );
  };

  // Calculate totals
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.flower?.price || 0) * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (!validateForm()) return;

    const composedDeliveryAddress = `${street.trim()}, д. ${house.trim()}${
      apartment.trim() ? `, кв. ${apartment.trim()}` : ""
    }`;

    const composedNotes = [
      `Дата доставки: ${deliveryDate}`,
      `Время доставки: ${deliveryTime}`,
      customerEmail.trim() ? `Email заказчика: ${customerEmail.trim()}` : null,
      orderComment.trim() ? `Комментарий: ${orderComment.trim()}` : null,
      !isRecipientCustomer
        ? `Получатель: ${recipientName.trim()} (${recipientPhone.trim()})`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    
    setIsSubmitting(true);
    hapticImpact('medium');
    
    try {
      const order = await createOrder({
        deliveryAddress: composedDeliveryAddress,
        phoneNumber: customerPhone,
        notes: composedNotes,
      });
      
      if (order) {
        hapticImpact('heavy');
        router.push(`/payment/${order.id}`);
      }
      // If order is null, the toast notification is already shown by the OrderContext
    } catch (error: any) {
      hapticImpact('medium');
      // Additional error handling if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
        <Header user={null} />
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-lg text-ink-600 dark:text-ink-300">
              Пожалуйста, войдите через Telegram для оформления заказа
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
        <Header user={user} />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-20">
            <div className="text-lg text-ink-600 dark:text-ink-300 mb-4">
              Ваша корзина пуста
            </div>
            <button
              onClick={() => router.push("/")}
              className="rounded bg-brand-600 px-6 py-2 text-white hover:bg-brand-700 transition-colors"
            >
              Перейти к покупкам
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-ink-900 dark:text-white">
          Оформление заказа
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer */}
          <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-ink-900 dark:text-white">
              Заказчик
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  value={user.firstName}
                  readOnly
                  className="w-full rounded-md border border-brand-200 px-3 py-2 text-ink-700 bg-brand-50 dark:border-ink-700 dark:bg-ink-700 dark:text-ink-200"
                />
              </div>

              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                  Телефон
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (customerPhoneError) setCustomerPhoneError(null);
                  }}
                  onBlur={() => setCustomerPhoneError(validatePhoneNumber(customerPhone))}
                  className={`w-full rounded-md border px-3 py-2 text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-1 dark:bg-ink-700 dark:text-white dark:placeholder-ink-400 ${
                    customerPhoneError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                      : "border-brand-200 focus:border-brand-500 focus:ring-brand-500 dark:border-ink-700"
                  }`}
                  placeholder="+7 (999) 123-45-67"
                />
                {customerPhoneError && (
                  <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {customerPhoneError}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="customerEmail" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    if (customerEmailError) setCustomerEmailError(null);
                  }}
                  onBlur={() => setCustomerEmailError(validateEmail(customerEmail))}
                  className={`w-full rounded-md border px-3 py-2 text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-1 dark:bg-ink-700 dark:text-white dark:placeholder-ink-400 ${
                    customerEmailError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                      : "border-brand-200 focus:border-brand-500 focus:ring-brand-500 dark:border-ink-700"
                  }`}
                  placeholder="example@mail.com"
                />
                {customerEmailError && (
                  <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {customerEmailError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-ink-900 dark:text-white">
              Адрес доставки
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                  Улица
                </label>
                <input
                  type="text"
                  id="street"
                  value={street}
                  onChange={(e) => {
                    setStreet(e.target.value);
                    if (streetError) setStreetError(null);
                  }}
                  onBlur={() => setStreetError(validateRequired(street, "Укажите улицу"))}
                  className={`w-full rounded-md border px-3 py-2 text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-1 dark:bg-ink-700 dark:text-white dark:placeholder-ink-400 ${
                    streetError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                      : "border-brand-200 focus:border-brand-500 focus:ring-brand-500 dark:border-ink-700"
                  }`}
                  placeholder="Например, Ленина"
                />
                {streetError && (
                  <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {streetError}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="house" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                    Дом
                  </label>
                  <input
                    type="text"
                    id="house"
                    value={house}
                    onChange={(e) => {
                      setHouse(e.target.value);
                      if (houseError) setHouseError(null);
                    }}
                    onBlur={() => setHouseError(validateRequired(house, "Укажите дом"))}
                    className={`w-full rounded-md border px-3 py-2 text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-1 dark:bg-ink-700 dark:text-white dark:placeholder-ink-400 ${
                      houseError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                        : "border-brand-200 focus:border-brand-500 focus:ring-brand-500 dark:border-ink-700"
                    }`}
                    placeholder="12"
                  />
                  {houseError && (
                    <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {houseError}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="apartment" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                    Квартира
                  </label>
                  <input
                    type="text"
                    id="apartment"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    className="w-full rounded-md border border-brand-200 px-3 py-2 text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-700 dark:text-white dark:placeholder-ink-400"
                    placeholder="34"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="deliveryDate" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                    Дата доставки
                  </label>
                  <input
                    type="date"
                    id="deliveryDate"
                    value={deliveryDate}
                    onChange={(e) => {
                      setDeliveryDate(e.target.value);
                      if (deliveryDateError) setDeliveryDateError(null);
                    }}
                    onBlur={() => setDeliveryDateError(validateRequired(deliveryDate, "Укажите дату доставки"))}
                    className={`w-full rounded-md border px-3 py-2 text-ink-900 focus:outline-none focus:ring-1 dark:bg-ink-700 dark:text-white ${
                      deliveryDateError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                        : "border-brand-200 focus:border-brand-500 focus:ring-brand-500 dark:border-ink-700"
                    }`}
                  />
                  {deliveryDateError && (
                    <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {deliveryDateError}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="deliveryTime" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                    Время доставки
                  </label>
                  <input
                    type="time"
                    id="deliveryTime"
                    value={deliveryTime}
                    onChange={(e) => {
                      setDeliveryTime(e.target.value);
                      if (deliveryTimeError) setDeliveryTimeError(null);
                    }}
                    onBlur={() => setDeliveryTimeError(validateRequired(deliveryTime, "Укажите время доставки"))}
                    className={`w-full rounded-md border px-3 py-2 text-ink-900 focus:outline-none focus:ring-1 dark:bg-ink-700 dark:text-white ${
                      deliveryTimeError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                        : "border-brand-200 focus:border-brand-500 focus:ring-brand-500 dark:border-ink-700"
                    }`}
                  />
                  {deliveryTimeError && (
                    <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {deliveryTimeError}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="orderComment" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                  Комментарий к заказу
                </label>
                <textarea
                  id="orderComment"
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-brand-200 px-3 py-2 text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-700 dark:text-white dark:placeholder-ink-400"
                  placeholder="Например, позвонить за 10 минут"
                />
              </div>
            </div>
          </div>

          {/* Recipient */}
          <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-ink-900 dark:text-white">
              Получатель
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 text-ink-700 dark:text-ink-200">
                <input
                  type="checkbox"
                  checked={isRecipientCustomer}
                  onChange={(e) => {
                    setIsRecipientCustomer(e.target.checked);
                    setRecipientNameError(null);
                    setRecipientPhoneError(null);
                  }}
                  className="h-4 w-4 rounded border-brand-200 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm">Я являюсь получателем</span>
              </label>

              {!isRecipientCustomer && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="recipientName" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                      Имя получателя
                    </label>
                    <input
                      type="text"
                      id="recipientName"
                      value={recipientName}
                      onChange={(e) => {
                        setRecipientName(e.target.value);
                        if (recipientNameError) setRecipientNameError(null);
                      }}
                      onBlur={() =>
                        setRecipientNameError(
                          validateRequired(recipientName, "Укажите имя получателя"),
                        )
                      }
                      className={`w-full rounded-md border px-3 py-2 text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-1 dark:bg-ink-700 dark:text-white dark:placeholder-ink-400 ${
                        recipientNameError
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                          : "border-brand-200 focus:border-brand-500 focus:ring-brand-500 dark:border-ink-700"
                      }`}
                      placeholder="Имя"
                    />
                    {recipientNameError && (
                      <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {recipientNameError}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="recipientPhone" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                      Телефон получателя
                    </label>
                    <input
                      type="tel"
                      id="recipientPhone"
                      value={recipientPhone}
                      onChange={(e) => {
                        setRecipientPhone(e.target.value);
                        if (recipientPhoneError) setRecipientPhoneError(null);
                      }}
                      onBlur={() =>
                        setRecipientPhoneError(validatePhoneNumber(recipientPhone))
                      }
                      className={`w-full rounded-md border px-3 py-2 text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-1 dark:bg-ink-700 dark:text-white dark:placeholder-ink-400 ${
                        recipientPhoneError
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                          : "border-brand-200 focus:border-brand-500 focus:ring-brand-500 dark:border-ink-700"
                      }`}
                      placeholder="+7 (999) 123-45-67"
                    />
                    {recipientPhoneError && (
                      <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {recipientPhoneError}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-ink-900 dark:text-white">
              Состав заказа
            </h2>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-ink-600 dark:text-ink-300">
                    {item.flower?.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-ink-900 dark:text-white">
                    {(item.flower?.price || 0) * item.quantity} ₽
                  </span>
                </div>
              ))}
              <div className="border-t border-brand-200 dark:border-ink-700 pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-ink-900 dark:text-white">Итого:</span>
                  <span className="text-brand-700 dark:text-brand-300">{cartTotal} ₽</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-brand-600 py-3 text-white font-medium hover:bg-brand-700 transition-colors disabled:bg-ink-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Оформление..." : "Подтвердить заказ"}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
