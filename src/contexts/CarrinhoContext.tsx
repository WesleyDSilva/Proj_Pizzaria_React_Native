// CarrinhoContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
// Certifique-se que o caminho para CarrinhoItem está correto
// Normalmente, interfaces são definidas em arquivos separados ou no próprio contexto se não forem muito complexas.
// Se CarrinhoItem está definido em outro lugar, importe de lá. Senão, defina aqui:
export interface CarrinhoItem {
  id: number;
  pizza_id: number;
  preco: number;
  nome_pizza: string;
  tipo_pizza: string;
  cliente_id?: number; // Permitindo undefined ou número
}

// Interface definindo o que o contexto vai fornecer
interface CarrinhoContextProps {
  carrinho: CarrinhoItem[];
  setCarrinho: React.Dispatch<React.SetStateAction<CarrinhoItem[]>>; // Mantido para fetchCarrinho no componente
  adicionarPizza: (pizza: CarrinhoItem) => void; // Nome correto
  removerPizza: (itemId: number) => void; // Remove UMA instância pelo ID único do item
  removerTodasAsPizzasDoTipo: (pizzaId: number) => void; // Remove TODAS as instâncias de um tipo de pizza
  limparCarrinho: () => void; // Limpa todo o carrinho
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
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);

  const adicionarPizza = useCallback((pizza: CarrinhoItem) => {
    console.log('CONTEXTO: Adicionando pizza:', pizza);
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

  const contextValue: CarrinhoContextProps = {
    carrinho,
    setCarrinho,
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
