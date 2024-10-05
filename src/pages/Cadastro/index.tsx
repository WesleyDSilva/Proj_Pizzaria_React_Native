// src/pages/Cadastro/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importar o hook de navegação

export default function Cadastro() {
    const navigation = useNavigation(); // Usar o hook de navegação

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Cadastro</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                <Text style={styles.buttonText}>Voltar para Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'yellow', // Fundo amarelo
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20, // Adicionar um espaço abaixo do título
    },
    button: {
        width: '80%',
        height: 40,
        backgroundColor: '#FFA831', // Cor do botão
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20, // Espaço acima do botão
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
});

