import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Cadastro from '../pages/Cadastro';

import SignIn from '../pages/SignIn';
//import Cadastro from "../pages/Cadastro"; // Certifique-se de que esta importação esteja correta
import Pedidos from '../pages/Pedidos';
import Detalhes from '../pages/Pedidos/Detalhes';

const Stack = createNativeStackNavigator();

function AuthRoutes() {
  return (
    <Stack.Navigator initialRouteName="SignIn">
      <Stack.Screen
        name="SignIn"
        component={SignIn}
        options={{headerShown: false}}
      />
      <Stack.Screen name="Cadastro" component={Cadastro} />
    </Stack.Navigator>
  );
}

export default AuthRoutes;
