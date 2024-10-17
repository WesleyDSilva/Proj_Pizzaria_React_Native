// src/pages/Entrada/index.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Image, TouchableOpacity } from 'react-native';

const Entrada = () => {
  const [busca, setBusca] = useState(''); // Estado para o campo de busca

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Texto no rodapé */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Bem Vindo(a) ao</Text>
        <Text style={styles.pizzariaText}>
          <Text style={styles.fatiasText}>Fatias & </Text>Sabores
        </Text>
      </View>

      {/* Campo de busca */}
      <TextInput
        placeholder="Buscar sabor da pizza..."
        style={styles.input}
        value={busca}
        onChangeText={setBusca}
      />

      {/* Imagem de pizzas */}
      <Image
        source={{ uri: 'https://example.com/imagem_pizza.png' }} // Substitua pela URL da imagem
        style={styles.pizzaImage}
      />

      {/* Texto de sabores de pizza */}
      <Text style={styles.sectionTitle}>Sabores:</Text>
      <Text style={styles.saborText}>Margherita, Calabresa, Quatro Queijos...</Text>

      {/* Propaganda de promoção */}
      <View style={styles.promotionContainer}>
        <Image
          source={{ uri: 'https://example.com/imagem_promo_pizza.png' }} // Substitua pela URL da imagem de promoção
          style={styles.promotionImage}
        />
        <Text style={styles.promotionText}>Pizza em promoção!</Text>
      </View>

      {/* Mais pedidos */}
      <Text style={styles.sectionTitle}>Mais Pedidos:</Text>
      <Text style={styles.saborText}>Pepperoni, Frango com Catupiry, Portuguesa...</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#FFF',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Poppins',
    textAlign: 'left',
    color: '#000',
  },
  pizzariaText: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 48,
    textAlign: 'left',
    fontFamily: 'Poppins',
    color: '#FFF',
    backgroundColor: 'rgba(0, 0, 0, 1)',
    width: 272,
    height: 48,
    marginTop: 10,
  },
  fatiasText: {
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#B0B0B0',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    color: '#000',
    backgroundColor: '#F4F4F4',
  },
  pizzaImage: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  saborText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#000',
  },
  promotionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  promotionImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  promotionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4500',
  },
});

export default Entrada;
