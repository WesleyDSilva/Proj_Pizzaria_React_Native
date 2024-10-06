// src/routes/authroutes.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SignIn from "../pages/SignIn";
import Cadastro from "../pages/Cadastro"; // Certifique-se de que esta importação esteja correta

const Stack = createNativeStackNavigator();

function AuthRoutes() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="SignIn" component={SignIn} options={{ headerShown: false }} />
            <Stack.Screen 
                name="Cadastro" 
                component={Cadastro} 
                options={{ 
                    title: '', // Define o título do header
                    headerShown: true, // Mostra o header para a tela Cadastro
                    headerBackTitleVisible: false, // Opcional: Remove o texto do botão de voltar (deixando apenas o ícone)
                    headerTintColor: '#FFA831', // Cor do ícone de voltar
                }} 
            />
        </Stack.Navigator>
    );
}

export default AuthRoutes;
