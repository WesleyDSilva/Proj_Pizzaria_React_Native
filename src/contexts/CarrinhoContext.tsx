import React, { createContext, useContext, useState } from 'react';

interface Pizza {
  id: number;
  nome: string;
  descricao: string;
  preco: number | null;
}

interface CarrinhoContextProps {
  carrinho: Pizza[];
  adicionarPizza: (pizza: Pizza) => void;
  removerPizza: (id: number) => void;
}

const CarrinhoContext = createContext<CarrinhoContextProps | undefined>(undefined);

export const CarrinhoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [carrinho, setCarrinho] = useState<Pizza[]>([]);

  const adicionarPizza = (pizza: Pizza) => {
    setCarrinho(prev => [...prev, pizza]);
  };

  const removerPizza = (id: number) => {
    setCarrinho(prev => prev.filter(pizza => pizza.id !== id));
  };

  return (
    <CarrinhoContext.Provider value={{ carrinho, adicionarPizza, removerPizza }}>
      {children}
    </CarrinhoContext.Provider>
  );
};

export const useCarrinho = () => {
  const context = useContext(CarrinhoContext);
  if (!context) {
    throw new Error('useCarrinho deve ser usado dentro de um CarrinhoProvider');
  }
  return context;
};
