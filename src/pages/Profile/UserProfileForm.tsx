import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  TextInput,
  Text,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import {AuthContext} from '../../contexts/AuthContext';
import {buscaEndereco} from '../../services/enderecoService';

const UserProfileForm = () => {
  const {user} = useContext(AuthContext);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
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

  const handleCepChange = async (value: string) => {
    setCep(value);
    if (value.length === 8) {
      try {
        setLoading(true);
        const endereco = await buscaEndereco(value);
        setLogradouro(endereco.logradouro);
        setCidade(endereco.cidade);
        setUf(endereco.estado);
      } catch (err) {
        Alert.alert('Erro');
      } finally {
        setLoading(false);
      }
    } else {
      setLogradouro('');
      setCidade('');
      setUf('');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setError('Usuário não autenticado.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `https://devweb3.ok.etc.br/api/api_get_user.php?id=${user.id}`,
        );
        const usuario = response.data;

        if (usuario && usuario.id) {
          setNome(usuario.nome);
          setCpf(usuario.cpf);
          setLogradouro(usuario.logradouro);
          setCidade(usuario.cidade);
          setUf(usuario.UF);
          setCep(usuario.cep);
          setComplemento(usuario.complemento);
          setNumeroCasa(usuario.numero_casa);
          setEmail(usuario.email);
          setTelefone(usuario.telefone);
        } else {
          //<Button title="Logout" onPress={signOut} />;
          setError('Usuário não encontrado.');
        }
      } catch (err) {
        setError(
          'Erro ao carregar os dados do usuário. Tente novamente mais tarde.',
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  const handleSave = async () => {
    if (senha && senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não correspondem.');
      return;
    }

    const dadosAtualizados = {
      id: user.id,
      nome,
      cpf,
      logradouro,
      cidade,
      uf,
      cep,
      complemento,
      numeroCasa,
      email,
      telefone,
      senha: senha || undefined,
    };
    console.log('Dados a serem enviados:', dadosAtualizados);

    try {
      await axios.post(
        'https://devweb3.ok.etc.br/api/api_update_user.php',
        dadosAtualizados,
      );
      Alert.alert('Sucesso', 'Dados atualizados com sucesso.');
    } catch (err) {
      Alert.alert(
        'Erro',
        'Erro ao atualizar os dados. Tente novamente mais tarde.',
      );
      console.error(err);
    }
  };

  if (loading) return <Text>Carregando...</Text>;
  if (error) return <Text style={{color: 'red'}}>{error}</Text>;

  const {signOut} = useContext(AuthContext);
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>MEU PERFIL</Text>

      <Text style={styles.textInput}>Nome:</Text>
      <TextInput
        style={styles.input}
        value={nome}
        onChangeText={setNome}
        placeholder="Digite seu nome"
      />

      <Text style={styles.textInput}>Cpf:</Text>
      <TextInput
        style={styles.input}
        value={cpf}
        onChangeText={setNome}
        placeholder="Digite seu cpf"
      />

      <Text style={styles.textInput}>Logradouro:</Text>
      <TextInput
        style={styles.input}
        value={logradouro}
        editable={false}
        placeholder="Digite seu logradouro"
      />

      <Text style={styles.textInput}>Cidade:</Text>
      <TextInput
        style={styles.input}
        value={cidade}
        editable={false}
        placeholder="Digite sua cidade"
      />

      <Text style={styles.textInput}>UF:</Text>
      <TextInput
        style={styles.input}
        value={uf}
        editable={false}
        placeholder="Digite sua UF"
      />

      <Text style={styles.textInput}>CEP:</Text>
      <TextInput
        style={styles.input}
        value={cep}
        onChangeText={handleCepChange}
        placeholder="Digite seu CEP"
        keyboardType="numeric"
        maxLength={8}
      />

      <Text style={styles.textInput}>Complemento:</Text>
      <TextInput
        style={styles.input}
        value={complemento}
        onChangeText={setComplemento}
        placeholder="Digite o complemento"
      />

      <Text style={styles.textInput}>Número da Casa:</Text>
      <TextInput
        style={styles.input}
        value={numeroCasa}
        onChangeText={setNumeroCasa}
        placeholder="Digite o número da casa"
      />

      <Text style={styles.textInput}>Email:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Digite seu email"
      />

      <Text style={styles.textInput}>Telefone:</Text>
      <TextInput
        style={styles.input}
        value={telefone}
        onChangeText={setTelefone}
        placeholder="Digite seu telefone"
      />

      <Text style={styles.textInput}>Senha:</Text>
      <TextInput
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        placeholder="Digite sua senha"
      />

      <Text style={styles.textInput}>Confirmar Senha:</Text>
      <TextInput
        style={styles.input}
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        secureTextEntry
        placeholder="Confirme sua senha"
      />

      <TouchableOpacity style={styles.buttonContainer2} onPress={handleSave}>
        <Text style={styles.buttonText2}>SALVAR</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonContainer} onPress={signOut}>
        <Text style={styles.buttonText}>SAIR</Text>
      </TouchableOpacity>
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
    color: 'black',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    color: 'black',
  },
  textInput: {
    color: 'black',
    fontSize: 15,
  },
  buttonContainer: {
    marginBottom: 35,
    borderRadius: 25, // Reduzi o valor para evitar distorções
    backgroundColor: 'transparent',
    borderColor: '#FFA831',
    borderWidth: 4,
    paddingVertical: 10,
    paddingHorizontal: 20, // Adiciona um pouco de espaço lateral
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  buttonContainer2: {
    marginBottom: 20,
    borderRadius: 80,
    backgroundColor: '#FFA831',
    padding: 10,
    marginTop: 15,
  },
  buttonText2: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UserProfileForm;
