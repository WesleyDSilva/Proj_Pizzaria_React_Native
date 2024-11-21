import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

const UserProfileForm = () => {
  // Estados para armazenar os dados do formulário
  const [id, setId] = useState(''); // ID oculto
  const [nome, setNome] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [cep, setCep] = useState('');
  const [complemento, setComplemento] = useState('');
  const [numeroCasa, setNumeroCasa] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState(''); // Nova senha
  const [confirmarSenha, setConfirmarSenha] = useState(''); // Confirmação da senha
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Função para buscar os dados do usuário via GET
  useEffect(() => {
    axios.get('https://devweb3.ok.etc.br/api/api_get_user.php') // Substitua pela URL da sua API
      .then(response => {
        const usuario = response.data[0]; // Supondo que a API retorna um array com um objeto
        if (usuario) {
          setId(usuario.id); // Armazena o ID sem exibir no formulário
          setNome(usuario.nome);
          setLogradouro(usuario.logradouro);
          setCidade(usuario.cidade);
          setUf(usuario.UF);
          setCep(usuario.cep);
          setComplemento(usuario.complemento);
          setNumeroCasa(usuario.numero_casa);
          setEmail(usuario.email);
          setTelefone(usuario.telefone);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Erro ao carregar os dados');
        setLoading(false);
      });
  }, []);

  // Função para salvar os dados atualizados
  const handleSave = () => {
    if (senha && senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não correspondem.');
      return;
    }

    const dadosAtualizados = {
      id, // Inclui o ID na requisição
      nome,
      logradouro,
      cidade,
      uf,
      cep,
      complemento,
      numeroCasa,
      email,
      telefone,
      senha: senha || undefined, // Envia a senha apenas se preenchida
    };

    axios.post('https://devweb3.ok.etc.br/api/api_update_user.php', dadosAtualizados)
      .then(response => {
        Alert.alert('Sucesso', 'Dados atualizados com sucesso.');
      })
      .catch(err => {
        Alert.alert('Erro', 'Erro ao atualizar os dados.');
        console.error(err);
      });
  };

  if (loading) {
    return <Text>Carregando...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Formulário de Usuário</Text>

      <Text>Nome:</Text>
      <TextInput
        style={styles.input}
        value={nome}
        onChangeText={setNome}
      />

      <Text>Logradouro:</Text>
      <TextInput
        style={styles.input}
        value={logradouro}
        onChangeText={setLogradouro}
      />

      <Text>Cidade:</Text>
      <TextInput
        style={styles.input}
        value={cidade}
        onChangeText={setCidade}
      />

      <Text>UF:</Text>
      <TextInput
        style={styles.input}
        value={uf}
        onChangeText={setUf}
      />

      <Text>CEP:</Text>
      <TextInput
        style={styles.input}
        value={cep}
        onChangeText={setCep}
      />

      <Text>Complemento:</Text>
      <TextInput
        style={styles.input}
        value={complemento}
        onChangeText={setComplemento}
      />

      <Text>Número da Casa:</Text>
      <TextInput
        style={styles.input}
        value={numeroCasa}
        onChangeText={setNumeroCasa}
      />

      <Text>Email:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <Text>Telefone:</Text>
      <TextInput
        style={styles.input}
        value={telefone}
        onChangeText={setTelefone}
      />

      <Text>Nova Senha:</Text>
      <TextInput
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <Text>Confirmar Senha:</Text>
      <TextInput
        style={styles.input}
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        secureTextEntry
      />

      <Button
        title="Salvar"
        onPress={handleSave}
      />
    </View>
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
