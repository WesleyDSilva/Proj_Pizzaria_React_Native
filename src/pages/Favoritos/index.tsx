import React, {useState, useEffect, useContext} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import {AuthContext} from '../../contexts/AuthContext';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useIsFocused} from '@react-navigation/native';

const DEFAULT_IMAGE_URL =
  'https://via.placeholder.com/150/cccccc/808080?text=Pizza';

export default function Favoritos() {
  const {user} = useContext(AuthContext);
  const [favoritos, setFavoritos] = useState<
    {
      id_favorito: number;
      cliente_id: number;
      id_pizza: number;
      nome_pizza: any;
      preco_total: string;
      imagem: any;
    }[]
  >([]); // Aqui é onde você especifica o tipo do estado de favorit
  const [filteredFavoritos, setFilteredFavoritos] = useState<
    {
      id_favorito: number;
      cliente_id: number;
      id_pizza: number;
      nome_pizza: any;
      preco_total: string;
      imagem: any;
    }[]
  >([]); // Aqui também especifica o tipo de `filteredFavoritos`
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Aceita tanto string quanto null

  const [searchQuery, setSearchQuery] = useState('');
  const isFocused = useIsFocused();

  // Função para buscar os favoritos na API
  const fetchFavoritos = async () => {
    if (!user?.id) {
      setFavoritos([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `https://devweb3.ok.etc.br/api/api_get_pedidos_favoritos.php?cliente_id=${user.id}`,
      );
      if (Array.isArray(response.data)) {
        const favoritosFormatados = response.data.map(fav => ({
          id_favorito: Number(fav.id_favorito),
          cliente_id: Number(fav.cliente_id),
          id_pizza: Number(fav.id_pizza),
          nome_pizza: fav.nome_pizza || 'Pizza Favorita',
          preco_total: fav.preco_total
            ? parseFloat(fav.preco_total).toFixed(2)
            : '0.00',
          imagem: fav.imagem || DEFAULT_IMAGE_URL,
        }));
        setFavoritos(favoritosFormatados);
        setFilteredFavoritos(favoritosFormatados);
      } else {
        setFavoritos([]);
        setFilteredFavoritos([]);
      }
    } catch (err) {
      setFavoritos([]);
      setFilteredFavoritos([]);
      setError('Não foi possível carregar seus favoritos.');
    } finally {
      setLoading(false);
    }
  };

  // Função para remover um favorito
  const removerFavorito = async (id_pizza: number) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não identificado.');
      return;
    }
    try {
      const response = await axios.get(
        `https://devweb3.ok.etc.br/api/api_delete_favorito.php?pizza_id=${id_pizza}&cliente_id=${user.id}`,
      );
      if (response.data.success) {
        setFavoritos(prev => prev.filter(fav => fav.id_pizza !== id_pizza));
        setFilteredFavoritos(prev =>
          prev.filter(fav => fav.id_pizza !== id_pizza),
        );
        Alert.alert('Sucesso', 'Favorito removido!');
      } else {
        Alert.alert('Erro', 'Não foi possível remover o favorito.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro de rede ao remover.');
    }
  };

  // Função para atualizar a busca e filtrar a lista
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = favoritos.filter(fav =>
      fav.nome_pizza.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredFavoritos(filtered);
  };

  useEffect(() => {
    if (isFocused && user?.id) {
      fetchFavoritos();
    } else if (!user?.id) {
      setFavoritos([]);
      setFilteredFavoritos([]);
      setError(null);
    }
  }, [isFocused, user?.id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Meus Favoritos</Text>
        <View style={styles.centeredMessage}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchFavoritos} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Favoritos</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar Pizza"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <View style={styles.searchIconContainer}>
          <Icon
            name="search"
            size={20}
            color="#fff"
            style={styles.searchIcon}
          />
        </View>
      </View>

      {filteredFavoritos.length > 0 ? (
        <FlatList
          data={filteredFavoritos}
          keyExtractor={item => item.id_favorito.toString()}
          numColumns={2}
          contentContainerStyle={styles.multiItemContentContainer}
          renderItem={({item}) => {
            const precoExibicao = `R$ ${item.preco_total}`;

            return (
              <View style={styles.itemContainer}>
                <View style={styles.pizzaImageContainer}>
                  <Image
                    source={{uri: item.imagem}}
                    style={styles.pizzaImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.pizzaName} numberOfLines={2}>
                    {item.nome_pizza}
                  </Text>
                  <Text style={styles.pizzaPrice}>{precoExibicao}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removerFavorito(item.id_pizza)}
                  style={styles.removeIconContainer}>
                  <Icon name="trash" size={20} color="#515151" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      ) : (
        <View style={styles.centeredMessage}>
          <Text style={styles.emptyText}>Você ainda não tem favoritos.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  multiItemContentContainer: {
    paddingHorizontal: 5,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 5, // Ajuste da margem para colunas
    width: '48%', // Garante 2 itens por linha
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pizzaImageContainer: {
    width: 135, // Aumenta o tamanho total para incluir o espaço extra
    height: 135,
    borderRadius: 80, // Metade do width/height para manter o círculo
    backgroundColor: '#FFEACE', // Cor do espaço ao redor da imagem
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    borderWidth: 2, // Define a borda preta externa
    borderColor: '#FFA831', // Cor preta para a borda externa
  },
  pizzaImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2, // Borda da imagem

    backgroundColor: '#FFEACE', // Fundo para garantir o espaço de 5px
    alignSelf: 'center',
  },
  textContainer: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pizzaName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
    marginBottom: 4,
  },
  pizzaPrice: {
    fontSize: 20,
    //color: '#00897B',
    color: 'red',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  removeIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFEACE', // Cor de fundo do botão
    padding: 5,
    borderRadius: 100,
    borderWidth: 2, // Define a espessura da borda
    borderColor: '#FFA831', // Cor da borda (altere para a desejada)
  },
  centeredMessage: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
  errorText: {
    fontSize: 18,
    color: '#E53935',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingRight: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 80,
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  searchIconContainer: {
    position: 'absolute',
    right: 10,
    backgroundColor: '#FFA500',
    padding: 5,
    borderRadius: 50,
  },
  searchIcon: {
    alignSelf: 'center',
  },
});
