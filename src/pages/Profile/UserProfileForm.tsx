import React, { useState, useEffect, useContext } from 'react';
import { View, TextInput, Text, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';

const UserProfileForm = () => {
    const { user } = useContext(AuthContext);
    const [nome, setNome] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [cidade, setCidade] = useState('');
    const [uf, setUf] = useState('');
    const [cep, setCep] = useState('');
    const [complemento, setComplemento] = useState('');
    const [numeroCasa, setNumeroCasa] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user.id) {
                setError('Usuário não autenticado.');
                setLoading(false);
                return;
            }

            try {
                console.log('User:', user);
                console.log('User ID:', user.id);

                const response = await axios.get(`https://devweb3.ok.etc.br/api/api_get_user.php?id=${user.id}`);
                const usuario = response.data; // Aqui, response.data é um objeto, não um array

                if (usuario && usuario.id) {
                    // Se o usuário for encontrado, preenche os campos
                    setNome(usuario.nome);
                    setLogradouro(usuario.logradouro);
                    setCidade(usuario.cidade);
                    setUf(usuario.UF);
                    setCep(usuario.cep);
                    setComplemento(usuario.complemento);
                    setNumeroCasa(usuario.numero_casa);
                    setEmail(usuario.email);
                    setTelefone(usuario.telefone);
                } else {
                    setError('Usuário não encontrado.');
                }
            } catch (err) {
                setError('Erro ao carregar os dados do usuário. Tente novamente mais tarde.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user.id]); // Aqui, a dependência é o user.id

    const handleSave = async () => {
        if (senha && senha !== confirmarSenha) {
            Alert.alert('Erro', 'As senhas não correspondem.');
            return;
        }

        const dadosAtualizados = {
            id: user.id,
            nome,
            logradouro,
            cidade,
            uf,
            cep,
            complemento,
            numero_casa: numeroCasa,
            email,
            telefone,
            senha: senha || undefined,
        };

        try {
            await axios.post('https://devweb3.ok.etc.br/api/api_update_user.php', dadosAtualizados);
            Alert.alert('Sucesso', 'Dados atualizados com sucesso.');
        } catch (err) {
            Alert.alert('Erro', 'Erro ao atualizar os dados. Tente novamente mais tarde.');
            console.error(err);
        }
    };

    if (loading) return <Text>Carregando...</Text>;
    if (error) return <Text style={{ color: 'red' }}>{error}</Text>;

    const { signOut } = useContext(AuthContext);
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Perfil do Usuário</Text>

            <Text>Nome:</Text>
            <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Digite seu nome"
            />

            <Text>Logradouro:</Text>
            <TextInput
                style={styles.input}
                value={logradouro}
                onChangeText={setLogradouro}
                placeholder="Digite seu logradouro"
            />

            <Text>Cidade:</Text>
            <TextInput
                style={styles.input}
                value={cidade}
                onChangeText={setCidade}
                placeholder="Digite sua cidade"
            />

            <Text>UF:</Text>
            <TextInput
                style={styles.input}
                value={uf}
                onChangeText={setUf}
                placeholder="Digite sua UF"
            />

            <Text>CEP:</Text>
            <TextInput
                style={styles.input}
                value={cep}
                onChangeText={setCep}
                placeholder="Digite seu CEP"
            />

            <Text>Complemento:</Text>
            <TextInput
                style={styles.input}
                value={complemento}
                onChangeText={setComplemento}
                placeholder="Digite o complemento"
            />

            <Text>Número da Casa:</Text>
            <TextInput
                style={styles.input}
                value={numeroCasa}
                onChangeText={setNumeroCasa}
                placeholder="Digite o número da casa"
            />

            <Text>Email:</Text>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu email"
            />

            <Text>Telefone:</Text>
            <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={setTelefone}
                placeholder="Digite seu telefone"
            />

            <Text>Senha:</Text>
            <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                placeholder="Digite sua senha"
            />

            <Text>Confirmar Senha:</Text>
            <TextInput
                style={styles.input}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
                placeholder="Confirme sua senha"
            />

            <Button title="Salvar" onPress={handleSave} />
            <Button title="Logout" onPress={signOut} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 10,
        paddingLeft: 10,
    },
});

export default UserProfileForm;
