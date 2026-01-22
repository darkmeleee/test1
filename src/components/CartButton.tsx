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
      className="fixed bottom-24 right-4 flex items-center space-x-2 rounded-full bg-green-600 px-4 py-3 text-white shadow-lg hover:bg-green-700 transition-colors z-40"
    >
      <ShoppingCart className="h-5 w-5" />
      <div className="flex flex-col items-start">
        <div className="text-xs opacity-90">Корзина</div>
        <div className="flex items-center space-x-2">
          <span className="font-bold">{count}</span>
          <span className="text-sm">{total} ₽</span>
        </div>
      </div>
    </button>
  );
}
