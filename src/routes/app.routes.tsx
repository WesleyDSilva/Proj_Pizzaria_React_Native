import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";



import Dashboard from "../pages/Dashboard";
import { Text, View } from "react-native";

const Stack = createNativeStackNavigator();
//<Stack.Screen name="Dashboard" component={Dashboard}></Stack.Screen>
        

function AppRoutes(){
    return(
        <Stack.Navigator>
            <Stack.Screen name="Dashboard" component={Dashboard} />
        </Stack.Navigator>
    )
}

export default AppRoutes;