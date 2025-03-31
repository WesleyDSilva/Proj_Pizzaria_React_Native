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
} from 'react-native';
import {AuthContext} from '../../contexts/AuthContext';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useIsFocused} from '@react-navigation/native';

type FavoritoApiItem = {
  id_favorito: string | number;
  cliente_id: string | number;
  id_pizza: string | number;
  nome_pizza?: string | null;
  ingredientes?: string | null;
  preco_unitario?: string | null;
  preco_total?: string | null;
  imagem?: string | null;
};

type Favorito = {
  id_favorito: number;
  cliente_id: number;
  id_pizza: number;
  nome_pizza: string;
  preco_total: string;
  imagem: string;
};

const DEFAULT_IMAGE_URL =
  'https://via.placeholder.com/150/cccccc/808080?text=Pizza';

export default function Favoritos() {
  const {user} = useContext(AuthContext);
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFocused = useIsFocused();

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
      const response = await axios.get<FavoritoApiItem[] | any>(
        `https://devweb3.ok.etc.br/api/api_get_pedidos_favoritos.php?cliente_id=${user.id}`,
      );
      if (Array.isArray(response.data)) {
        const favoritosFormatados: Favorito[] = response.data
          .filter(fav => fav?.id_favorito && fav?.id_pizza && fav?.cliente_id)
          .map(fav => ({
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
      } else {
        setFavoritos([]);
      }
    } catch (err) {
      setFavoritos([]);
      setError('Não foi possível carregar seus favoritos.');
    } finally {
      setLoading(false);
    }
  };

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
        Alert.alert('Sucesso', 'Favorito removido!');
      } else {
        Alert.alert('Erro', 'Não foi possível remover o favorito.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro de rede ao remover.');
    }
  };

  useEffect(() => {
    if (isFocused && user?.id) {
      fetchFavoritos();
    } else if (!user?.id) {
      setFavoritos([]);
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
      {favoritos.length > 0 ? (
        <FlatList
          data={favoritos}
          keyExtractor={item => item.id_favorito.toString()}
          numColumns={2}
          contentContainerStyle={styles.multiItemContentContainer}
          renderItem={({item}) => {
            const precoExibicao = `R$ ${item.preco_total}`;

            return (
              <View style={styles.itemContainer}>
                <Image
                  source={{uri: item.imagem}}
                  style={styles.pizzaImage}
                  resizeMode="contain"
                />
                <View style={styles.textContainer}>
                  <Text style={styles.pizzaName} numberOfLines={2}>
                    {item.nome_pizza}
                  </Text>
                  <Text style={styles.pizzaPrice}>{precoExibicao}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removerFavorito(item.id_pizza)}
                  style={styles.removeIconContainer}>
                  <Icon name="trash" size={20} color="#E53935" />
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
  pizzaImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e0e0e0',
  },
  textContainer: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pizzaName: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    color: '#444',
    marginBottom: 4,
  },
  pizzaPrice: {
    fontSize: 14,
    color: '#00897B',
    textAlign: 'center',
    fontWeight: '500',
  },
  removeIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 20,
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
});
