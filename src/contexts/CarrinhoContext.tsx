// Arquivo: src/contexts/CarrinhoContext.tsx

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  Dispatch, // Importar Dispatch
  SetStateAction, // Importar SetStateAction
} from 'react';

// INTERFACE DEFINITIVA E ÚNICA PARA CarrinhoItem
export interface CarrinhoItem {
  id: number; // Mapeado de id_item_pedido
  produto_id: number; // Mapeado de produto_id_api (ID do produto)
  preco: number; // Mapeado de total_item_pedido
  nome_produto: string; // Mapeado de nome_produto
  tipo_tamanho: string | null; // Mapeado de tipo_tamanho_pedido
  tamanho: string | null; // Mapeado de tamanho_pedido
  caminho_imagem?: string; // Mapeado de caminho_imagem_produto
  status_pedido: string; // Mapeado de status_item_pedido
}

interface CarrinhoContextData {
  carrinho: CarrinhoItem[];
  setCarrinho: Dispatch<SetStateAction<CarrinhoItem[]>>; // Tipo correto para setCarrinho
  limparCarrinho: () => void;
  // Se tiver outras funções, garanta que usem a CarrinhoItem acima
}

const CarrinhoContext = createContext<CarrinhoContextData>(
  {} as CarrinhoContextData,
);

export const CarrinhoProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);

  const limparCarrinho = useCallback(() => {
    setCarrinho([]);
  }, []);

  const contextValue: CarrinhoContextData = {
    carrinho,
    setCarrinho,
    limparCarrinho,
  };

  return (
    <CarrinhoContext.Provider value={contextValue}>
      {children}
    </CarrinhoContext.Provider>
  );
};

export function useCarrinho(): CarrinhoContextData {
  const context = useContext(CarrinhoContext);
  if (!context) {
    throw new Error('useCarrinho must be used within a CarrinhoProvider');
  }
  return context;
}
