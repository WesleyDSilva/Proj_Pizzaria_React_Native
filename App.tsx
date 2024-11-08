import { StatusBar } from "react-native";
import { StyleSheet, Text, View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import Routes from "./src/routes";

import { AuthProvider } from "./src/contexts/AuthContext";




export default function App(){
  return(
    <NavigationContainer>   
      <AuthProvider>  
        <StatusBar backgroundColor="#FFA831" barStyle="light-content" translucent={false}/>
        <Routes/>
      </AuthProvider>
    </NavigationContainer>       
    
  );
}


/*
import React from 'react';
import Entrada from './src/pages/Cadastro'; // Importa a nova página

const App = () => {
  return <Entrada />;  // Renderiza a página de teste diretamente
};

export default App;
*/

