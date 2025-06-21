// src/routes/app.routes.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigation'; // Importar

import Dashboard from '../pages/Dashboard';
//import OrderScreen from '../pages/Order';

import PedidosScreen from '../pages/Pedidos'; // Este é o PedidosScreen unificado

// import BottomTabsNavigator from '../pages/Bottom_Tabs'; // Se AppTabs estiver aqui

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppRoutes() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={Dashboard}
        options={{headerShown: false}}
      />
      {/*<Stack.Screen
        name="Order"
        //component={OrderScreen}
        options={{headerShown: false}}
      />*/}
      <Stack.Screen
        name="Pedidos"
        component={PedidosScreen}
        options={{title: 'Meus Pedidos'}}
      />
      {/* A rota DetalhesDoPedido foi removida pois sua funcionalidade está em PedidosScreen */}
      {/* <Stack.Screen
        name="Detalhes"
        component={DetalhesScreen}
        options={{title: 'Detalhes'}}
      />*/}
      {/*
      <Stack.Screen
        name="AppTabs" // Nome da rota para o navegador de abas
        component={BottomTabsNavigator}
        options={{ headerShown: false }}
      />
      */}
    </Stack.Navigator>
  );
}
export default AppRoutes;
