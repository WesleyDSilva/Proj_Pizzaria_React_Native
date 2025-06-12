// src/contexts/CarrinhoContext.tsx

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  Dispatch,
  SetStateAction,
} from 'react';

// Interface DEFINITIVA para os itens no contexto do carrinho
export interface CarrinhoItem {
  id: number; // ID único do item no pedido (ex: pedido_id da tabela Pedidos)
  produto_id: number; // ID do produto
  preco: number; // Preço unitário do produto no momento da adição
  nome_produto: string;
  tipo_tamanho: string | null;
  tamanho: string | null;
  caminho_imagem?: string;
  status_pedido: string; // Status do item (ex: PENDENTE)
  quantidade: number; // Quantidade deste item específico (desta linha de pedido)
}

interface CarrinhoContextData {
  carrinho: CarrinhoItem[];
  setCarrinho: Dispatch<SetStateAction<CarrinhoItem[]>>;
  limparCarrinho: () => void;
  // Você pode adicionar outras funções aqui, como adicionarItemAoCarrinho, removerItem, etc.
  // se quiser centralizar mais lógica no contexto, mas por enquanto fetchCarrinhoData está no CarrinhoScreen.
}

const CarrinhoContext = createContext<CarrinhoContextData>(
  {} as CarrinhoContextData, // Inicialização com um objeto vazio tipado
);

export const CarrinhoProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);

  const limparCarrinho = useCallback(() => {
    console.log('CarrinhoContext: Limpando carrinho.');
    setCarrinho([]);
  }, []);

  // Exemplo de como poderia ser uma função para adicionar/atualizar itens (não usada no seu CarrinhoScreen atual)
  // const adicionarOuAtualizarItem = useCallback((novoItem: CarrinhoItem) => {
  //   setCarrinho(prevCarrinho => {
  //     // Lógica para verificar se o item já existe e atualizar quantidade/preço ou adicionar novo
  //     // Esta lógica está atualmente no `gruposCarrinho` do CarrinhoScreen para exibição,
  //     // mas o estado `carrinho` em si armazena as linhas como vêm da API.
  //     return [...prevCarrinho, novoItem]; // Exemplo simples de adicionar
  //   });
  // }, []);

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
  if (context === undefined) {
    // Verifica se o contexto é undefined
    throw new Error('useCarrinho deve ser usado dentro de um CarrinhoProvider');
  }
  return context;
}
