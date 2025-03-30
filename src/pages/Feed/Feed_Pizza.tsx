import React, {useEffect, useState, useContext} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image, // Importação necessária para a imagem no menu
  Button,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import {useCarrinho} from '../../contexts/CarrinhoContext';
import {AuthContext} from '../../contexts/AuthContext';

// Definindo o tipo dos dados da API - COM o campo 'caminho'
interface Pizza {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  caminho: string; // Adicionado para a URL da imagem
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
        // Usando a interface atualizada com 'caminho'
        const response = await axios.get<Pizza[]>(
          'https://devweb3.ok.etc.br/api/api_get_pizzas.php',
        );
        // Mapeando apenas para converter o preço, mantendo 'caminho'
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

  // --- Funções handleAddPizza, handleRemovePizza, handleConfirmAddition, handleCancelAddition permanecem iguais ---
  const handleAddPizza = (pizza: Pizza) => {
    const currentQuantity = quantities[pizza.id] || 0;

    if (currentQuantity === 1) {
      setModalMessage(
        `Deseja adicionar uma pizza inteira ${pizza.nome}? Preço: R$ ${
          (pizza.preco || 0) * 2
        }`,
      );
      setSelectedPizzas([pizza]);
      setModalVisible(true);
    } else if (selectedPizzas.length === 1) {
      const previousPizza = selectedPizzas[0];
      setModalMessage(
        `Deseja adicionar meia ${previousPizza.nome} e meia ${
          pizza.nome
        }? Preço: R$ ${(previousPizza.preco || 0) + (pizza.preco || 0)}`,
      );
      setSelectedPizzas([...selectedPizzas, pizza]);
      setModalVisible(true);
    } else {
      setQuantities(prev => ({...prev, [pizza.id]: currentQuantity + 1}));
      setSelectedPizzas([pizza]);
    }
  };

  const handleRemovePizza = (pizza: Pizza) => {
    const currentQuantity = quantities[pizza.id] || 0;
    if (currentQuantity > 0) {
      setQuantities(prev => ({
        ...prev,
        [pizza.id]: currentQuantity - 1,
      }));
    }
  };

  const handleConfirmAddition = () => {
    if (!user.id) {
      setModalMessage(
        'Você precisa estar logado para adicionar itens ao carrinho.',
      );
      setModalVisible(true);
      return;
    }

    selectedPizzas.forEach(pizza => {
      const tipoPizza = selectedPizzas.length > 1 ? 'meia' : 'inteira';
      const precoFinal =
        tipoPizza === 'inteira' ? pizza.preco * 2 : pizza.preco;

      axios
        .post('https://devweb3.ok.etc.br/api/api_registrar_carrinho.php', {
          cliente_id: user.id,
          pizza_id: pizza.id,
          preco: precoFinal,
          nome_pizza: pizza.nome,
          tipo_pizza: tipoPizza,
        })
        .then(response => {
          console.log('Pizza registrada no carrinho:', response.data);
        })
        .catch(error => {
          console.error('Erro ao registrar pizza no carrinho:', error);
        });
    });

    setModalVisible(false);
    setQuantities({});
    setSelectedPizzas([]);
  };

  const handleCancelAddition = () => {
    setModalVisible(false);
    setQuantities({});
    setSelectedPizzas([]);
  };

  const filteredPizzas = pizzas.filter(pizza =>
    pizza.nome.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Render item para a lista principal (vertical) - SEM IMAGEM
  const renderItem = ({item}: {item: Pizza}) => (
    <View style={styles.itemContainer}>
      {/* Nenhuma imagem aqui */}
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

  // Render item para a lista horizontal (menu) - COM IMAGEM e estilo original
  const renderMenuItem = ({item}: {item: Pizza}) => (
    <TouchableOpacity style={styles.menuItem}>
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
        {/* Ícone de busca original */}
        <View style={styles.searchIconContainer}>
          <Icon name="search" size={18} color="#fff" />
        </View>
      </View>

      {/* Lista horizontal (Menu) */}
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
            renderItem={renderMenuItem} // Usa a função COM imagem
            ListEmptyComponent={
              <Text style={styles.emptyMenu}>Carregando pizzas...</Text>
            }
          />
        )}
      </View>

      {/* Lista principal (Vertical) */}
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
          renderItem={renderItem} // Usa a função SEM imagem
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

      {/* Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelAddition}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <View style={styles.modalButtons}>
              <Button
                title="Adicionar"
                onPress={handleConfirmAddition}
                color="#FFA500"
              />
              <View style={{width: 10}} />
              <Button
                title="Cancelar"
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

// Estilos ajustados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8', // Mantendo o fundo
  },
  searchContainer: {
    // Mantendo o estilo da busca original
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 50,
    paddingLeft: 15, // Ajuste no padding
    paddingRight: 5, // Ajuste no padding
    alignSelf: 'center', // Centralizar a barra
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#fff', // Fundo branco para a barra
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  searchIconContainer: {
    // Estilo do ícone de busca original
    backgroundColor: '#FFA500',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  // Estilos Menu Horizontal (COM IMAGEM e estilo laranja)
  menuContainer: {
    width: '100%',
    paddingVertical: 10, // Espaçamento vertical
    // borderBottomWidth: 1, // Pode remover a borda se preferir
    // borderBottomColor: '#ddd',
    backgroundColor: '#f8f8f8', // Fundo do container do menu
  },
  menuList: {
    paddingHorizontal: 10, // Espaçamento lateral
  },
  menuItem: {
    // Estilo original do botão laranja, com espaço para imagem
    paddingVertical: 10, // Ajuste o padding vertical
    paddingHorizontal: 15, // Ajuste o padding horizontal
    backgroundColor: '#FFA500', // Cor laranja original
    borderRadius: 25, // Bordas mais arredondadas
    marginHorizontal: 6, // Espaço entre os itens
    alignItems: 'center', // Centraliza conteúdo (imagem e texto)
    minWidth: 120, // Largura mínima para caber conteúdo
  },
  menuItemImage: {
    // Estilo para a imagem DENTRO do botão laranja
    width: 55, // Tamanho da imagem
    height: 55,
    borderRadius: 27.5, // Metade da largura/altura para ser círculo
    marginBottom: 8, // Espaço entre imagem e texto
    backgroundColor: '#fff', // Fundo branco enquanto carrega (opcional)
  },
  menuItemText: {
    // Estilo original do texto
    color: '#fff', // Cor branca
    fontSize: 14, // Tamanho da fonte
    fontWeight: 'bold',
    textAlign: 'center', // Centraliza o texto
  },
  emptyMenu: {
    paddingHorizontal: 20,
    color: '#999',
  },
  // Estilos Lista Principal (SEM IMAGEM e layout original)
  list: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemContainer: {
    // Layout original do item da lista principal
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Cor da borda mais suave
    backgroundColor: '#fff', // Fundo branco para itens da lista
    marginHorizontal: 5, // Pequena margem lateral
    marginBottom: 10, // Espaço entre itens
    borderRadius: 5, // Leve arredondamento
  },
  row: {
    // Layout original dos controles
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    // Estilo original do título
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
    flex: 1, // Para ocupar espaço disponível
  },
  itemDescription: {
    // Estilo original da descrição
    fontSize: 14,
    color: '#666',
    marginLeft: 45, // Alinhar com controles (ajuste conforme necessário)
    marginBottom: 5,
  },
  itemPrice: {
    // Estilo original do preço
    fontSize: 16,
    color: '#4CAF50', // Verde
    fontWeight: 'bold',
    alignSelf: 'flex-end', // Alinhar à direita
    marginRight: 10, // Espaço à direita
  },
  quantity: {
    // Estilo original da quantidade
    fontSize: 18,
    marginHorizontal: 12,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 25,
    textAlign: 'center',
  },
  controls: {
    // Container para os controles +/-
    // Não precisa de estilo extra aqui se já estão na 'row'
  },
  empty: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  // Estilos Modal (sem alterações significativas)
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
