import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View } from "react-native";
import Icon from 'react-native-vector-icons/Feather';

import Feed from "../Feed";
import Carrinho from "../Carrinho";
import Profile from "../Profile";
import Favoritos from "../Favoritos";

const Tab = createBottomTabNavigator();

export default function TabRoutes() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#fff', // Cor do ícone ativo
                tabBarInactiveTintColor: '#F38D00', // Cor do ícone inativo
                tabBarStyle: {
                    backgroundColor: '#F38D00', // Cor de fundo da barra
                },
            }}
        >
            <Tab.Screen
                name="feed"
                component={Feed}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <View style={{
                            backgroundColor: '#fff',
                            borderRadius: 25,
                            padding: 5,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}> 
                            <Icon name="home" color={color} size={size} />
                        </View>
                    ),
                    tabBarLabel: 'Início'
                }}
            />

            <Tab.Screen
                name="carrinho"
                component={Carrinho}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon name="shopping-cart" color={color} size={size} />,
                    tabBarLabel: 'Carrinho'
                }}
            />

            <Tab.Screen
                name="user"
                component={Profile}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon name="user" color={color} size={size} />,
                    tabBarLabel: 'Usuário'
                }}
            />

            <Tab.Screen
                name="new"
                component={Favoritos}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon name="heart" color={color} size={size} />,
                    tabBarLabel: 'Novo'
                }}
            />
        </Tab.Navigator>
    );
}
.