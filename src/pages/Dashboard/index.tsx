import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import {CarrinhoProvider} from '../../contexts/CarrinhoContext';

import Feed from '../Feed';
import Carrinho from '../Carrinho';
import Profile from '../Profile';
import Favoritos from '../Favoritos';
import Pedidos from '../Pedidos';

const Tab = createBottomTabNavigator();

export default function Bottom_Tabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000', // Cor do ícone ativo
        tabBarInactiveTintColor: '#F38D00', // Cor do ícone inativo
        tabBarStyle: {
          backgroundColor: '#F38D00', // Cor de fundo da barra
        },
      }}>
      <Tab.Screen
        name="feed"
        component={Feed}
        options={{
          tabBarIcon: ({color, size}) => (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 25,
                padding: 5,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon name="home" color={color} size={size} />
            </View>
          ),
          tabBarLabel: '',
        }}
      />

      <Tab.Screen
        name="carrinho"
        component={Carrinho}
        options={{
          tabBarIcon: ({color, size}) => (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 25,
                padding: 5,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon name="shopping-cart" color={color} size={size} />
            </View>
          ),
          tabBarLabel: '',
        }}
      />

      <Tab.Screen
        name="pedidos"
        component={Pedidos}
        options={{
          tabBarIcon: ({color, size}) => (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 25,
                padding: 5,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon name="shopping-bag" color={color} size={size} />
            </View>
          ),
          tabBarLabel: '',
        }}
      />

      <Tab.Screen
        name="user"
        component={Profile}
        options={{
          tabBarIcon: ({color, size}) => (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 25,
                padding: 5,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon name="user" color={color} size={size} />
            </View>
          ),
          tabBarLabel: '',
        }}
      />

      <Tab.Screen
        name="new"
        component={Favoritos}
        options={{
          tabBarIcon: ({color, size}) => (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 25,
                padding: 5,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon name="heart" color={color} size={size} />
            </View>
          ),
          tabBarLabel: '',
        }}
      />
    </Tab.Navigator>
  );
}
