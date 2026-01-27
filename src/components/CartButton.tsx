import { ShoppingCart } from "lucide-react";

interface CartButtonProps {
  count: number;
  total: number;
  onClick: () => void;
}

export default function CartButton({ count, total, onClick }: CartButtonProps) {
  return (
    <button
      onClick={onClick}
      title={`Корзина: ${count} · ${total} ₽`}
      aria-label={`Открыть корзину. Товаров: ${count}. Сумма: ${total} ₽.`}
      className="fixed bottom-24 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-colors hover:bg-brand-700"
    >
      <ShoppingCart className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-ink-900 px-1.5 py-0.5 text-xs font-bold text-white">
        {count}
      </span>
    </button>
  );
}
