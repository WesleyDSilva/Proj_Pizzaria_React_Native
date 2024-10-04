import React, {useContext, useState} from "react";
import {View, Text, Button} from 'react-native'
import { AuthContext } from "../../contexts/AuthContext";

export default function Dashboard(): React.JSX.Element{
    const {signOut} = useContext(AuthContext);
    return(
        <View>
            <Text>Tela Dashboard</Text>
            <Button
                title='Sair do app'
                onPress={signOut}
            />
        </View>
    )
}