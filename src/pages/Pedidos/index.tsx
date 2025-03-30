import React from 'react';
import {StyleSheet, Text, View, Button} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

// Definindo o tipo para a navegação
type RootStackParamList = {
  Pedidos: undefined;
  Detalhes: undefined;
};

type PedidosScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Pedidos'
>;

interface PedidosProps {
  navigation: PedidosScreenNavigationProp;
}

export default function Pedidos({navigation}: PedidosProps) {
  console.log('Tela de Pedidos foi carregada');

  return (
    <View style={styles.container}>
      <Text>Pedidos</Text>
      {/* Botão para navegar para a próxima tela */}
      <Button
        title="Ir para Detalhes"
        onPress={() => navigation.navigate('Detalhes')} // Navega para a tela 'Detalhes'
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
