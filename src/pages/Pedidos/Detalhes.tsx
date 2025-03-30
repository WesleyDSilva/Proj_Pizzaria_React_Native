import React from 'react';
import {StyleSheet, Text, View, Button} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

// Definindo o tipo para a navegação
type RootStackParamList = {
  Pedidos: undefined;
  Detalhes: undefined;
};

type DetalhesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Detalhes'
>;

interface DetalhesProps {
  navigation: DetalhesScreenNavigationProp;
}

export default function Detalhes({navigation}: DetalhesProps) {
  return (
    <View style={styles.container}>
      <Text>Esta é a tela de Detalhes</Text>
      {/* Botão para voltar à tela anterior */}
      <Button
        title="Voltar"
        onPress={() => navigation.goBack()} // Volta para a tela anterior
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
