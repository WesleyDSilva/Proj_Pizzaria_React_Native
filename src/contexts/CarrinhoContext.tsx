// CarrinhoContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from 'react';

// Defina a interface CarrinhoItem AQUI e inclua TODAS as propriedades
export interface CarrinhoItem {
  id: number; // ID único do item no carrinho (vindo de carrinho_id da API)
  pizza_id: number; // ID do tipo da pizza
  preco: number;
  nome_pizza: string;
  tipo_pizza: string;
  cliente_id?: number;
  caminho_imagem?: string; // <-- ADICIONE ESTA LINHA (opcional)
}

// Interface definindo o que o contexto vai fornecer
interface CarrinhoContextProps {
  carrinho: CarrinhoItem[];
  setCarrinho: React.Dispatch<React.SetStateAction<CarrinhoItem[]>>;
  adicionarPizza: (pizza: CarrinhoItem) => void; // Não usado diretamente, mas pode ser útil
  removerPizza: (itemId: number) => void; // Remove pelo ID único do item no carrinho
  removerTodasAsPizzasDoTipo: (pizzaId: number) => void; // Remove pelo ID da pizza
  limparCarrinho: () => void;
}

// Cria o contexto
const CarrinhoContext = createContext<CarrinhoContextProps | undefined>(
  undefined,
);

// Hook customizado
export const useCarrinho = () => {
  const context = useContext(CarrinhoContext);
  if (!context) {
    throw new Error('useCarrinho deve ser usado dentro de um CarrinhoProvider');
  }
  return context;
};

// Componente Provider
export const CarrinhoProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  // O estado agora usa a interface CarrinhoItem atualizada
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);

  // Função mantida para permitir que fetchCarrinho no componente atualize o estado
  // Adicionar direto no contexto pode causar dessincronia se a API falhar
  const adicionarPizza = useCallback((pizza: CarrinhoItem) => {
    // Esta função pode não ser ideal se você sempre depende do fetch para adicionar.
    // Mas a mantemos se houver outros usos.
    console.log('CONTEXTO: Adicionando pizza (estado local):', pizza);
    setCarrinho(prev => [...prev, pizza]);
  }, []);

  const removerPizza = useCallback((itemIdParaRemover: number) => {
    console.log(`CONTEXTO: Removendo item com ID único: ${itemIdParaRemover}`);
    setCarrinho(prevCarrinho =>
      prevCarrinho.filter(item => item.id !== itemIdParaRemover),
    );
  }, []);

  const removerTodasAsPizzasDoTipo = useCallback(
    (pizzaIdParaRemover: number) => {
      console.log(
        `CONTEXTO: Removendo TODAS as pizzas com pizza_id: ${pizzaIdParaRemover}`,
      );
      setCarrinho(prevCarrinho =>
        prevCarrinho.filter(item => item.pizza_id !== pizzaIdParaRemover),
      );
    },
    [],
  );

  const limparCarrinho = useCallback(() => {
    console.log('CONTEXTO: Limpando carrinho.');
    setCarrinho([]);
  }, []);

  // O valor do contexto usa o estado com o tipo correto
  const contextValue: CarrinhoContextProps = {
    carrinho,
    setCarrinho, // Expondo setCarrinho é crucial para fetchCarrinho funcionar
    adicionarPizza,
    removerPizza,
    removerTodasAsPizzasDoTipo,
    limparCarrinho,
  };

  return (
    <CarrinhoContext.Provider value={contextValue}>
      {children}
    </CarrinhoContext.Provider>
  );
};
