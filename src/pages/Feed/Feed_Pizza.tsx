import React, {useEffect, useState, useContext} from 'react';
import {
  StyleSheet,
  Text,
  View, // View é necessária
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  Button,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import {useCarrinho} from '../../contexts/CarrinhoContext';
import {AuthContext} from '../../contexts/AuthContext';

// Interface Pizza
interface Pizza {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  caminho: string;
}

export default function Feed() {
  const {adicionarPizza} = useCarrinho();
  const {user} = useContext(AuthContext);
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [quantities, setQuantities] = useState<{[key: number]: number}>({});
  const [selectedPizzas, setSelectedPizzas] = useState<Pizza[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchPizzas = async () => {
      try {
        const response = await axios.get<Pizza[]>(
          'https://devweb3.ok.etc.br/api/api_get_pizzas.php',
        );
        const pizzasComDadosCorrigidos = response.data.map(pizza => ({
          ...pizza,
          preco: parseFloat(pizza.preco as unknown as string) || 0,
        }));
        setPizzas(pizzasComDadosCorrigidos);
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPizzas();
  }, []);

  // Handler para adicionar/incrementar meia pizza (usado pelos botões +/- da lista principal)
  const handleAddPizza = (pizza: Pizza) => {
    const currentQuantity = quantities[pizza.id] || 0;

    if (currentQuantity === 1) {
      // Pergunta se quer adicionar a segunda metade (pizza inteira)
      setModalMessage(
        `Deseja adicionar uma pizza inteira ${pizza.nome}? Preço: R$ ${
          (pizza.preco || 0) * 2
        }`,
      );
      setSelectedPizzas([pizza]); // Seleciona a pizza para confirmação
      setModalVisible(true);
    } else if (selectedPizzas.length === 1) {
      // Pergunta se quer adicionar a segunda metade (outra pizza)
      const previousPizza = selectedPizzas[0];
      setModalMessage(
        `Deseja adicionar meia ${previousPizza.nome} e meia ${
          pizza.nome
        }? Preço: R$ ${(previousPizza.preco || 0) + (pizza.preco || 0)}`,
      );
      setSelectedPizzas([...selectedPizzas, pizza]); // Adiciona a segunda pizza selecionada
      setModalVisible(true);
    } else {
      // Adiciona a primeira metade
      setQuantities(prev => ({...prev, [pizza.id]: 1})); // Define quantidade como 1
      setSelectedPizzas([pizza]); // Seleciona a primeira pizza
      // Não mostra modal aqui, só atualiza a quantidade visualmente
    }
  };

  // Nova função para lidar com o clique direto no item do menu horizontal
  const handleMenuPizzaClick = (pizza: Pizza) => {
    // Verifica se usuário está logado ANTES de mostrar o modal de confirmação
    if (!user.id) {
      setModalMessage('Você precisa estar logado para adicionar itens.');
      setSelectedPizzas([]); // Limpa seleção anterior se houver
      setModalVisible(true);
      return; // Interrompe a função aqui
    }

    // Configura diretamente o modal para perguntar sobre a pizza INTEIRA
    setModalMessage(
      `Deseja adicionar uma pizza inteira ${pizza.nome}? Preço: R$ ${
        (pizza.preco || 0) * 2
      }`,
    );
    setSelectedPizzas([pizza]); // Define a pizza selecionada para confirmação
    setQuantities({}); // Reseta quantidades temporárias ao iniciar nova seleção pelo menu
    setModalVisible(true); // Mostra o modal
  };

  const handleRemovePizza = (pizza: Pizza) => {
    const currentQuantity = quantities[pizza.id] || 0;
    if (currentQuantity > 0) {
      setQuantities(prev => ({
        ...prev,
        [pizza.id]: currentQuantity - 1,
      }));
      // Se a quantidade for para zero e era a única selecionada, limpa seleção
      if (
        currentQuantity === 1 &&
        selectedPizzas.length === 1 &&
        selectedPizzas[0].id === pizza.id
      ) {
        setSelectedPizzas([]);
      }
    }
  };

  const handleConfirmAddition = () => {
    // A verificação de login já foi feita antes de abrir o modal de confirmação
    // ou no início desta função caso o modal seja genérico (como o de "precisa logar")
    if (!user.id) {
      // Esta verificação é redundante se o modal de login já foi tratado
      // Mas é bom manter por segurança caso o fluxo mude
      setModalMessage(
        'Você precisa estar logado para adicionar itens ao carrinho.',
      );
      // Garante que o modal correto seja fechado se necessário
      // setModalVisible(true); // Não reabrir o mesmo modal
      return;
    }

    // Se a mensagem for a de login, apenas feche o modal sem adicionar
    if (
      modalMessage === 'Você precisa estar logado para adicionar itens.' ||
      modalMessage ===
        'Você precisa estar logado para adicionar itens ao carrinho.'
    ) {
      setModalVisible(false);
      setSelectedPizzas([]);
      setQuantities({});
      return;
    }

    // Lógica original de confirmação - funciona para 1 ou 2 pizzas selecionadas
    selectedPizzas.forEach(pizza => {
      // Determina se é inteira (1 item selecionado) ou meia (2 itens selecionados)
      // A lógica aqui está correta vindo do handleAddPizza ou handleMenuPizzaClick
      const tipoPizza = selectedPizzas.length === 1 ? 'inteira' : 'meia';
      // Preço: inteiro (preco*2) ou meia (preco individual)
      const precoFinal =
        tipoPizza === 'inteira' ? (pizza.preco || 0) * 2 : pizza.preco || 0;

      axios
        .post('https://devweb3.ok.etc.br/api/api_registrar_carrinho.php', {
          cliente_id: user.id,
          pizza_id: pizza.id,
          preco: precoFinal,
          nome_pizza: pizza.nome,
          tipo_pizza: tipoPizza, // 'inteira' ou 'meia'
        })
        .then(response => {
          console.log('Pizza registrada no carrinho:', response.data);
        })
        .catch(error => {
          console.error('Erro ao registrar pizza no carrinho:', error);
        });
    });

    // Limpa estado após adicionar ao carrinho
    setModalVisible(false);
    setQuantities({});
    setSelectedPizzas([]);
  };

  const handleCancelAddition = () => {
    setModalVisible(false);
    // Só reseta a seleção se não for o modal de "precisa logar"
    if (
      modalMessage !== 'Você precisa estar logado para adicionar itens.' &&
      modalMessage !==
        'Você precisa estar logado para adicionar itens ao carrinho.'
    ) {
      setQuantities({});
      setSelectedPizzas([]);
    }
  };

  const filteredPizzas = pizzas.filter(pizza =>
    pizza.nome.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Render item para a lista principal (vertical) - SEM IMAGEM
  const renderItem = ({item}: {item: Pizza}) => (
    <View style={styles.itemContainer}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => handleRemovePizza(item)}>
          <Icon name="minus-circle" size={25} color="#ff6347" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{quantities[item.id] || 0}</Text>
        <TouchableOpacity onPress={() => handleAddPizza(item)}>
          <Icon name="plus-circle" size={25} color="#32cd32" />
        </TouchableOpacity>
        <Text style={styles.itemTitle}>
          {item.nome || 'Nome não disponível'}
        </Text>
      </View>
      <Text style={styles.itemDescription}>
        {item.descricao || 'Descrição não disponível'}
      </Text>
      <Text style={styles.itemPrice}>{`R$ ${item.preco.toFixed(2)}`}</Text>
    </View>
  );

  // Render item para a lista horizontal (menu) - Chama handleMenuPizzaClick
  const renderMenuItem = ({item}: {item: Pizza}) => (
    // TouchableOpacity externo chama a nova função
    <TouchableOpacity
      style={styles.menuItemOuterContainer}
      onPress={() => handleMenuPizzaClick(item)} // Chama a função específica do menu
    >
      <View style={styles.menuItemImageBackground}>
        <Image
          source={{uri: item.caminho}}
          style={styles.menuItemImage}
          onError={e =>
            console.log(
              `Erro ao carregar imagem (menu) ${item.caminho}:`,
              e.nativeEvent.error,
            )
          }
        />
      </View>
      <Text style={styles.menuItemText}>{item.nome}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Busque por nome da pizza..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.searchIconContainer}>
          <Icon name="search" size={18} color="#fff" />
        </View>
      </View>

      <View style={styles.menuContainer}>
        {loading ? (
          <ActivityIndicator
            style={{paddingVertical: 20}}
            size="small"
            color="#FFA500"
          />
        ) : (
          <FlatList
            data={pizzas}
            keyExtractor={item => `menu-${item.id.toString()}`}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuList}
            renderItem={renderMenuItem} // Renderiza o item do menu
            ListEmptyComponent={
              <Text style={styles.emptyMenu}>Carregando pizzas...</Text>
            }
          />
        )}
      </View>

      {loading && pizzas.length === 0 ? (
        <ActivityIndicator
          style={{marginTop: 50}}
          size="large"
          color="#0000ff"
        />
      ) : (
        <FlatList
          data={filteredPizzas}
          keyExtractor={item => `main-${item.id.toString()}`}
          renderItem={renderItem} // Renderiza o item da lista principal
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {searchQuery
                ? 'Nenhuma pizza encontrada para sua busca.'
                : 'Nenhuma pizza disponível.'}
            </Text>
          }
        />
      )}

      {/* Modal - Agora lida com diferentes mensagens */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelAddition}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <View style={styles.modalButtons}>
              {/* Só mostra botão Adicionar se não for a mensagem de login */}
              {modalMessage !==
                'Você precisa estar logado para adicionar itens.' &&
                modalMessage !==
                  'Você precisa estar logado para adicionar itens ao carrinho.' && (
                  <Button
                    title="Adicionar"
                    onPress={handleConfirmAddition}
                    color="#FFA500"
                  />
                )}
              {/* Espaçador só aparece se o botão Adicionar estiver visível */}
              {modalMessage !==
                'Você precisa estar logado para adicionar itens.' &&
                modalMessage !==
                  'Você precisa estar logado para adicionar itens ao carrinho.' && (
                  <View style={{width: 10}} />
                )}
              <Button
                // Muda o texto do botão Cancelar para OK se for só uma mensagem informativa
                title={
                  modalMessage ===
                    'Você precisa estar logado para adicionar itens.' ||
                  modalMessage ===
                    'Você precisa estar logado para adicionar itens ao carrinho.'
                    ? 'OK'
                    : 'Cancelar'
                }
                onPress={handleCancelAddition}
                color="#ff6347"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- Estilos (mantidos da versão anterior) ---
const IMAGE_SIZE = 55;
const BORDER_WIDTH = 2;
const IMAGE_WITH_BORDER_SIZE = IMAGE_SIZE + BORDER_WIDTH * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 50,
    paddingLeft: 15,
    paddingRight: 5,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  searchIconContainer: {
    backgroundColor: '#FFA500',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  menuContainer: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
  },
  menuList: {
    paddingHorizontal: 10,
    alignItems: 'flex-start',
  },
  menuItemOuterContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: IMAGE_WITH_BORDER_SIZE + 10,
  },
  menuItemImageBackground: {
    width: IMAGE_WITH_BORDER_SIZE,
    height: IMAGE_WITH_BORDER_SIZE,
    borderRadius: IMAGE_WITH_BORDER_SIZE / 2,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  menuItemImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: '#fff',
  },
  menuItemText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  emptyMenu: {
    paddingHorizontal: 20,
    color: '#999',
  },
  list: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    marginHorizontal: 5,
    marginBottom: 10,
    borderRadius: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 45,
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    marginRight: 10,
  },
  quantity: {
    fontSize: 18,
    marginHorizontal: 12,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 25,
    textAlign: 'center',
  },
  controls: {},
  empty: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 10,
    width: '85%',
    alignItems: 'center',
    elevation: 5,
  },
  modalMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
});
