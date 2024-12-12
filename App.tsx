import { StatusBar } from "react-native";
import { StyleSheet, Text, View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import Routes from "./src/routes";

import { AuthProvider } from "./src/contexts/AuthContext";

import { CarrinhoProvider } from "./src/contexts/CarrinhoContext";



export default function App(){
  return(
    <NavigationContainer>   
      <AuthProvider>  
        <StatusBar backgroundColor="#FFA831" barStyle="light-content" translucent={false}/>
        <CarrinhoProvider>
          <Routes/>
        </CarrinhoProvider>
      </AuthProvider>
    </NavigationContainer>       
    
  );
}


/*
import React from 'react';
import Entrada from './src/pages/Dashboard'; // Importa a nova página

const App = () => {
  return <Entrada />;  // Renderiza a página de teste diretamente
};

export default App;
*/
/*

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from './src/pages/Dashboard'; // Importa a página Dashboard

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Dashboard" 
          component={Dashboard} 
          options={{ headerShown: false }} // Oculta o header padrão, se necessário
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

*/