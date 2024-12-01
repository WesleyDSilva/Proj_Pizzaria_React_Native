import React, { createContext, useState, useContext, ReactNode } from 'react';

interface CarrinhoItem {
  id: number;
  cliente_id: number;
  preco: number;
  nome_pizza: string;
  tipo_pizza: string;
}

interface CarrinhoContextProps {
  carrinho: CarrinhoItem[];
  setCarrinho: React.Dispatch<React.SetStateAction<CarrinhoItem[]>>;
  adicionarPizza: (pizza: CarrinhoItem) => void;
  removerPizza: (pizzaId: number) => void;
}

const CarrinhoContext = createContext<CarrinhoContextProps | undefined>(undefined);

export const useCarrinho = () => {
  const context = useContext(CarrinhoContext);
  if (!context) {
    throw new Error('useCarrinho must be used within a CarrinhoProvider');
  }
  return context;
};

export const CarrinhoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);

  const adicionarPizza = (pizza: CarrinhoItem) => {
    setCarrinho((prev) => [...prev, pizza]);
  };

  const removerPizza = (pizzaId: number) => {
    setCarrinho((prev) => prev.filter(item => item.id !== pizzaId));
  };

  return (
    <CarrinhoContext.Provider value={{ carrinho, setCarrinho, adicionarPizza, removerPizza }}>
      {children}
    </CarrinhoContext.Provider>
  );
};
