import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Button,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';

// Definindo o tipo dos dados da API
interface Pizza {
  id: number;
  nome: string;
  descricao: string;
  preco: number | null;
}

export default function Feed() {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [selectedPizzas, setSelectedPizzas] = useState<Pizza[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPizzas = async () => {
      try {
        const response = await axios.get<Pizza[]>('https://devweb3.ok.etc.br/api/api_get_pizzas.php');
        const pizzasComPrecoConvertido = response.data.map(pizza => ({
          ...pizza,
          preco: parseFloat(pizza.preco as string) || null,
        }));

        setPizzas(pizzasComPrecoConvertido);
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPizzas();
  }, []);

  const handleAddPizza = (pizza: Pizza) => {
    const currentQuantity = quantities[pizza.id] || 0;

    if (currentQuantity === 1) {
      // Modal para pizza inteira
      setModalMessage(
        `Deseja adicionar uma pizza inteira ${pizza.nome}? Preço: R$ ${(pizza.preco || 0) * 2}`
      );
      setSelectedPizzas([pizza]);
      setModalVisible(true);
    } else if (selectedPizzas.length === 1) {
      // Modal para meia pizza combinada
      const previousPizza = selectedPizzas[0];
      setModalMessage(
        `Deseja adicionar meia ${previousPizza.nome} e meia ${pizza.nome}? Preço: R$ ${
          (previousPizza.preco || 0) + (pizza.preco || 0)
        }`
      );
      setSelectedPizzas([...selectedPizzas, pizza]);
      setModalVisible(true);
    } else {
      setQuantities(prev => ({ ...prev, [pizza.id]: currentQuantity + 1 }));
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

  const resetQuantities = () => {
    setQuantities({});
    setSelectedPizzas([]);
  };

  const handleConfirmAddition = () => {
    if (selectedPizzas.length === 2) {
      // Adicionar combinação de duas meias pizzas
      selectedPizzas.forEach(pizza => {
        setQuantities(prev => ({
          ...prev,
          [pizza.id]: 0, // Zera a quantidade
        }));
      });
    } else if (selectedPizzas.length === 1) {
      // Adicionar pizza inteira
      const pizza = selectedPizzas[0];
      setQuantities(prev => ({
        ...prev,
        [pizza.id]: 0, // Zera a quantidade
      }));
    }
    setModalVisible(false);
    resetQuantities(); // Reseta as quantidades
  };

  const handleCancelAddition = () => {
    setModalVisible(false);
    resetQuantities(); // Reseta as quantidades ao cancelar
  };

  const renderItem = ({ item }: { item: Pizza }) => (
    <View style={styles.itemContainer}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => handleRemovePizza(item)}>
          <Icon name="minus" size={20} color="#ff0000" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{quantities[item.id] || 0}</Text>
        <TouchableOpacity onPress={() => handleAddPizza(item)}>
          <Icon name="plus" size={20} color="#00a000" />
        </TouchableOpacity>
        <Text style={styles.itemTitle}>{item.nome || 'Nome não disponível'}</Text>
      </View>
      <Text style={styles.itemDescription}>{item.descricao || 'Descrição não disponível'}</Text>
      <Text style={styles.itemPrice}>
        {typeof item.preco === 'number' && !isNaN(item.preco)
          ? `R$ ${item.preco.toFixed(2)}`
          : 'Preço não disponível'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feed</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={pizzas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma pizza encontrada.</Text>}
        />
      )}

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelAddition}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <View style={styles.modalButtons}>
              <Button title="Adicionar" onPress={handleConfirmAddition} />
              <Button title="Cancelar" onPress={handleCancelAddition} color="#ff0000" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  list: {
    width: '100%',
    paddingHorizontal: 16,
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    color: '#00a000',
    marginTop: 8,
  },
  quantity: {
    fontSize: 18,
    marginHorizontal: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  empty: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});
