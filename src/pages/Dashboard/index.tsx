import React, {useContext, useState} from "react";
import {View, Text, Button, SafeAreaView,TouchableOpacity, TextInput, StyleSheet, } from 'react-native'
import { AuthContext } from "../../contexts/AuthContext";

import { useNavigation } from "@react-navigation/native"; 


export default function Dashboard(){
    const navigation = useNavigation();

    const[number, setNumber] = useState('');

    async function openOrder() {
        if(number===''){
            return;
        }

        //Requisição e navegar pata próxima tela
        //navigation.navigate()
    }

    const {signOut} = useContext(AuthContext);
    return(
        <SafeAreaView style= {styles.container}>
            <Text style={styles.title}>Novo Pedido</Text>

            <TextInput placeholder="Número da Mesa" 
                placeholderTextColor="#FFF" 
                style={styles.input}
                keyboardType="numeric"
                value={number}
                onChangeText={setNumber}
            />
            <TouchableOpacity style={styles.button} onPress={openOrder}>
                <Text style={styles.buttonText}>Abrir mesa</Text>

            </TouchableOpacity>
               
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent: 'center',
        alignItems:'center',
        paddingVertical:15,
        backgroundColor: '#F4F4F4',
    },
    title:{
        fontSize: 30,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 24,
    },
    input:{
        width:'90%',
        height:60,
        backgroundColor: '#fff',
        borderRadius: 4,
        paddingHorizontal:8,
        textAlign: 'center',
        fontSize: 22,
        color: '#000'
    },
    button:{
        width: '90%',
        height: 40,
        backgroundColor: '#FFA831',
        borderRadius: 4,
        marginVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',

    },
    buttonText:{
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold'

    }

})