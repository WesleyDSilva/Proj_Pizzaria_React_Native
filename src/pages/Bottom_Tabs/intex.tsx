// src/pages/Bottom_Tabs/index.tsx
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// import {CarrinhoProvider} from '../../contexts/CarrinhoContext'; // Removido para simplificar, coloque no nível do App

import Feed from '../Feed';
import Carrinho from '../Carrinho';
import Profile from '../Profile';
import Favoritos from '../Favoritos';
import PedidosScreen from '../Pedidos'; // Importando o PedidosScreen unificado

import {BottomTabParamList} from '../../types/navigation'; // Importando o tipo para as abas

const Tab = createBottomTabNavigator<BottomTabParamList>(); // Usando o tipo

export default function Bottom_Tabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#F38D00',
        tabBarStyle: {backgroundColor: '#F38D00'},
      }}>
      <Tab.Screen name="feed" component={Feed} /* ... options ... */ />
      <Tab.Screen name="carrinho" component={Carrinho} /* ... options ... */ />
      <Tab.Screen
        name="pedidos" // Esta aba agora usa o PedidosScreen unificado
        component={PedidosScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <View style={styles.iconContainer}>
              <Icon name="shopping-bag" color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tab.Screen name="user" component={Profile} /* ... options ... */ />
      <Tab.Screen
        name="favoritos" // Renomeado de 'new'
        component={Favoritos}
        options={{
          tabBarIcon: ({color, size}) => (
            <View style={styles.iconContainer}>
              <Icon name="heart" color={color} size={size} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Estilos para os ícones das abas
const styles = StyleSheet.create({
  iconContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
});
