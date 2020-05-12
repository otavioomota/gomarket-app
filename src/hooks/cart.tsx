import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStoraged = await AsyncStorage.getItem('@GoMarket:cart');

      if (productsStoraged) {
        setProducts(JSON.parse(productsStoraged));
      }
      // await AsyncStorage.clear();
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async ({ id, title, image_url, price }: Omit<Product, 'quantity'>) => {
      const productAlreadyInCartIndex = products.findIndex(
        product => product.id === id,
      );
      let productsUpdated = [];

      if (productAlreadyInCartIndex >= 0) {
        productsUpdated = [...products];
        productsUpdated[productAlreadyInCartIndex].quantity += 1;
        setProducts(productsUpdated);
      } else {
        productsUpdated = [
          ...products,
          { id, title, image_url, price, quantity: 1 },
        ];
        setProducts(productsUpdated);
      }

      // console.log('[Cart]: ', productsUpdated);

      await AsyncStorage.setItem(
        '@GoMarket:cart',
        JSON.stringify(productsUpdated),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      const productsUpdated: Product[] = [...products];

      productsUpdated[productIndex].quantity += 1;

      setProducts(productsUpdated);

      await AsyncStorage.setItem(
        '@GoMarket:cart',
        JSON.stringify(productsUpdated),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      const productsUpdated: Product[] = [...products];

      if (productsUpdated[productIndex].quantity <= 1) {
        return;
      }

      productsUpdated[productIndex].quantity -= 1;

      setProducts(productsUpdated);

      await AsyncStorage.setItem(
        '@GoMarket:cart',
        JSON.stringify(productsUpdated),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
