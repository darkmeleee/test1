import { MapPin, User } from "lucide-react";
import type { User as UserType } from "~/types";

interface HeaderProps {
  user: UserType | null;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Location */}
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              🌸 BUNCH
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="mr-1 h-4 w-4" />
              <span>Москва</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                {user.photoUrl && (
                  <img
                    src={user.photoUrl}
                    alt={user.firstName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </div>
                  {user.username && (
                    <div className="text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <User className="h-5 w-5" />
                <span className="text-sm">Гость</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
