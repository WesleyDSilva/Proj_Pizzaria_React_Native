// src/pages/SignIn/index.tsx
import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function SignIn() {
    const { signIn, loadingAuth } = useContext(AuthContext);
    const navigation = useNavigation();

    const [isFocused, setIsFocused] = useState(false);
    const [isFocusedUser, setIsFocusedUser] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleLogin() {
        if (email === '' || password === '') {
            return;
        }
        await signIn({ email, password });
    }

    return (
        <View style={styles.container}>
            <Image style={styles.logo} source={require('../../assets/logo.png')} />

            <View style={styles.inputContainer}>
                <TextInput
                    placeholder="Digite seu email"
                    style={[styles.input, isFocusedUser && styles.inputFocused]}
                    onFocus={() => setIsFocusedUser(true)}
                    onBlur={() => setIsFocusedUser(false)}
                    placeholderTextColor='#474747'
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    placeholder="Senha"
                    style={[styles.input, isFocused && styles.inputFocused]}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholderTextColor='#474747'
                    secureTextEntry={true}
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    {loadingAuth ? (
                        <ActivityIndicator size={25} color='#FFF' />
                    ) : (
                        <Text style={styles.buttonText}>Acessar</Text>
                    )}
                </TouchableOpacity>

                {/* Link para a página de Cadastro */}
                <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
                    <Text style={styles.linkText}>Não possui cadastro ainda? Clique aqui</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F4F4F4',
    },
    logo: {
        marginBottom: 18,
        width: 258,
        height: 255,
    },
    inputContainer: {
        width: '95%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 14,
    },
    input: {
        width: '95%',
        height: 40,
        backgroundColor: '#F4F4F4',
        borderColor: '#B0B0B0',
        borderWidth: 2,
        marginBottom: 12,
        borderRadius: 30,
        paddingHorizontal: 8,
        color: '#000',
    },
    inputFocused: {
        borderColor: '#ff0000',
    },
    button: {
        width: '95%',
        height: 40,
        backgroundColor: '#FFA831',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    linkText: {
        marginTop: 20, // Adicionando margem superior para espaçamento
        color: '#FFA831',
        textDecorationLine: 'underline',
        textAlign: 'center', // Alinhando ao centro
    },
});
