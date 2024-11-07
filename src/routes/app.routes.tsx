import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Dashboard from "../pages/Dashboard";
import Cadastro from "../pages/Cadastro"; // Importa corretamente a tela Cadastro
import SignIn from "../pages/SignIn"; 

const Stack = createNativeStackNavigator();

function AppRoutes(){
    return(
        <Stack.Navigator>
            <Stack.Screen name="Dashboard" component={Dashboard} options={{headerShown: false}} />
        </Stack.Navigator>
    )
}

export default AppRoutes;

