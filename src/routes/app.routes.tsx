import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Dashboard from "../pages/Dashboard";
import Cadastro from "../pages/Cadastro"; // Importa corretamente a tela Cadastro
import SignIn from "../pages/SignIn"; 

const Stack = createNativeStackNavigator();

function AppRoutes() {
  return (
    <Stack.Navigator initialRouteName="SignIn">
      <Stack.Screen 
        name="SignIn" 
        component={SignIn} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Cadastro" 
        component={Cadastro} // Verifique se o componente Cadastro está corretamente importado e registrado
        options={{ title: 'Cadastro' }} 
      />
      <Stack.Screen 
        name="Dashboard" 
        component={Dashboard} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}

export default AppRoutes;

