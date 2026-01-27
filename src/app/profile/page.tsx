"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { initTelegram } from "~/utils/telegram";
import { authenticateWithTelegram } from "~/utils/auth";
import { useOrder } from "~/contexts/OrderContext";
import type { User, Order } from "~/types";
import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { orders, isLoading } = useOrder();

  // Function to get user data directly from Telegram WebApp
  const getUserFromWebApp = () => {
    try {
      console.log('getUserFromWebApp called');
      
      if (typeof window === 'undefined') {
        console.log('Window is not available (server-side rendering)');
        return null;
      }
      
      // Log all available Telegram WebApp data for debugging
      console.log('Telegram object exists:', !!window.Telegram);
      console.log('WebApp object exists:', !!window.Telegram?.WebApp);
      console.log('initData exists:', !!window.Telegram?.WebApp?.initData);
      console.log('initDataUnsafe exists:', !!window.Telegram?.WebApp?.initDataUnsafe);
      
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        console.log('Found user in initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe.user);
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        return {
          id: user.id?.toString() || 'no-id',
          telegramId: user.id?.toString() || 'no-telegram-id',
          firstName: user.first_name || 'No',
          username: user.username || 'nousername',
          photoUrl: user.photo_url || ''
        };
      } else {
        console.log('No user in initDataUnsafe');
      }
      
      // Fallback to parsing initData directly
      if (window.Telegram?.WebApp?.initData) {
        console.log('initData exists, trying to parse it');
        try {
          const params = new URLSearchParams(window.Telegram.WebApp.initData);
          const userParam = params.get('user');
          console.log('User param from initData:', userParam);
          
          if (userParam) {
            const user = JSON.parse(decodeURIComponent(userParam));
            console.log('Parsed user from initData:', user);
            return {
              id: user.id?.toString() || 'no-id',
              telegramId: user.id?.toString() || 'no-telegram-id',
              firstName: user.first_name || 'No',
              username: user.username || 'nousername',
              photoUrl: user.photo_url || ''
            };
          }
        } catch (e) {
          console.error('Error parsing initData:', e);
        }
      } else {
        console.log('initData is not available');
      }
      
      console.log('No user data found in WebApp');
      return null;
    } catch (error) {
      console.error('Error in getUserFromWebApp:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('Profile: Starting initialization...');
    
    const initProfile = () => {
      try {
        console.log('Initializing Telegram WebApp...');
        initTelegram();
        
        // Debug: Log all available window properties
        console.log('Window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('telegram')));
        
        // Try to get user directly from WebApp first
        console.log('Trying to get user from WebApp...');
        const webAppUser = getUserFromWebApp();
        
        if (webAppUser) {
          console.log('✅ Successfully got user from WebApp:', webAppUser);
          setUser(webAppUser);
          return;
        }
        
        console.log('❌ Could not get user from WebApp, trying API authentication...');
        
        // Fallback to API authentication if WebApp data is not available
        authenticateWithTelegram()
          .then((userData) => {
            console.log('API authentication response:', userData);
            if (userData?.success && userData?.user) {
              console.log('✅ Using user from API:', userData.user);
              setUser(userData.user);
            } else {
              console.error('❌ Authentication failed: No user data received from API');
              // Show debug info in the UI
              setUser({
                id: 'debug-mode',
                telegramId: 'debug-telegram-id',
                firstName: 'Debug',
                lastName: 'Mode',
                username: 'debug_user',
                photoUrl: ''
              });
            }
          })
          .catch((error) => {
            console.error('❌ Authentication error:', error);
          });
          
      } catch (error) {
        console.error('❌ Initialization error:', error);
      } finally {
        console.log('Initialization process completed');
      }
    };
    
    // Try to initialize immediately
    console.log('Starting initialization...');
    initProfile();
    
    // Also set up a retry mechanism in case Telegram WebApp loads after our initial attempt
    const maxRetries = 5;
    let retryCount = 0;
    
    const retryInterval = setInterval(() => {
      if (user) {
        console.log('User data loaded, clearing retry interval');
        clearInterval(retryInterval);
        return;
      }
      
      if (retryCount >= maxRetries) {
        console.log('Max retries reached, giving up');
        clearInterval(retryInterval);
        return;
      }
      
      console.log(`Retry ${retryCount + 1}/${maxRetries} to get Telegram data...`);
      initProfile();
      retryCount++;
    }, 1000);
    
    return () => {
      clearInterval(retryInterval);
    };
  }, [user]); // Add user to dependencies to clear interval when user is loaded

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Загрузка профиля</h2>
          <p className="text-gray-600 dark:text-gray-400">Пожалуйста, подождите...</p>
        </div>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            {user.photoUrl && (
              <img
                src={user.photoUrl}
                alt={`${user.firstName}`}
                className="h-20 w-20 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.firstName}
              </h1>
              {user.username && (
                <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Telegram ID: {user.telegramId}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {totalOrders}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Заказы</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {orders.reduce((sum: number, order: Order) => sum + (order.items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0), 0)}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Всего товаров заказано</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {totalSpent} ₽
            </div>
            <div className="text-gray-600 dark:text-gray-400">Всего потрачено</div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Мои заказы
          </h2>
          
          {orders.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              У вас пока нет заказов
            </p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Заказ #{order.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-green-600 dark:text-green-400">
                        {order.totalAmount} ₽
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900' :
                        order.status === 'CONFIRMED' ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900' :
                        order.status === 'DELIVERED' ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900' :
                        'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
                      }`}>
                        {order.status === 'PENDING' ? 'В обработке' :
                         order.status === 'CONFIRMED' ? 'Подтвержден' :
                         order.status === 'DELIVERED' ? 'Доставлен' :
                         'Отменен'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {order.items?.length} {order.items?.length === 1 ? 'товар' : order.items?.length === 2 || order.items?.length === 3 || order.items?.length === 4 ? 'товара' : 'товаров'}
                  </div>
                  
                  <button
                    onClick={() => router.push(`/order-confirmation/${order.id}`)}
                    className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Посмотреть детали
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
