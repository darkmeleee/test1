import { MapPin, User } from "lucide-react";
import Image from "next/image";
import type { User as UserType } from "~/types";

interface HeaderProps {
  user: UserType | null;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-brand-50 dark:bg-ink-900 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Location */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Image src="/l.svg" alt="Расцвет" width={160} height={44} priority />
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
                  <div className="font-medium text-ink-900 dark:text-white">
                    {user.firstName}
                  </div>
                  {user.username && (
                    <div className="text-ink-600 dark:text-ink-300">
                      @{user.username}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-ink-600 dark:text-ink-300">
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
