import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native'; // Importação do hook de navegação

import {api_CEP} from '../../services/api_CEP';
import {buscaEndereco} from '../../services/enderecoService';
//import { cadastrarUsuario } from "../../services/api_cadastro";
import {cadastrarUsuario} from '../../services/api_cadastro';

export default function Cadastro(): React.JSX.Element {
  const navigation = useNavigation(); // Uso do hook de navegação
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');

  const handleCepChange = async (value: string) => {
    setCep(value);
    if (value.length === 8) {
      try {
        const endereco = await buscaEndereco(value);
        setLogradouro(endereco.logradouro);
        setCidade(endereco.cidade);
        setEstado(endereco.estado);
      } catch (error: any) {
        Alert.alert('Erro', error.message);
      }
    }
  };

  async function handleCadastro() {
    if (senha !== confirmaSenha) {
      Alert.alert('As senhas não conferem');
      return;
    }

    const data = {
      nome,
      cpf,
      logradouro,
      cidade,
      UF: estado,
      cep,
      complemento,
      numero_casa: numero,
      email,
      telefone,
      senha,
    };

    try {
      await cadastrarUsuario(data);
      Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!');
      // Resetar os campos do formulário, se necessário
      setNome('');
      setCpf('');
      setEmail('');
      setTelefone('');
      setCep('');
      setEstado('');
      setCidade('');
      setLogradouro('');
      setNumero('');
      setComplemento('');
      setSenha('');
      setConfirmaSenha('');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Botão no topo para voltar */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Cadastro</Text>

      <TextInput
        placeholder="Nome Completo"
        style={[styles.input, focusedField === 'nome' && styles.inputFocused]}
        onFocus={() => setFocusedField('nome')}
        onBlur={() => setFocusedField(null)}
        placeholderTextColor="#474747"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        placeholder="CPF"
        style={[styles.input, focusedField === 'cpf' && styles.inputFocused]}
        onFocus={() => setFocusedField('cpf')}
        onBlur={() => setFocusedField(null)}
        placeholderTextColor="#474747"
        value={cpf}
        onChangeText={setCpf}
        keyboardType="numeric"
      />

      <TextInput
        placeholder="E-mail"
        style={[styles.input, focusedField === 'email' && styles.inputFocused]}
        onFocus={() => setFocusedField('email')}
        onBlur={() => setFocusedField(null)}
        placeholderTextColor="#474747"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Telefone Celular"
        style={[
          styles.input,
          focusedField === 'telefone' && styles.inputFocused,
        ]}
        onFocus={() => setFocusedField('telefone')}
        onBlur={() => setFocusedField(null)}
        placeholderTextColor="#474747"
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
      />

      <TextInput
        placeholder="CEP"
        style={[styles.input, focusedField === 'cep' && styles.inputFocused]}
        onFocus={() => setFocusedField('cep')}
        onBlur={() => setFocusedField(null)}
        placeholderTextColor="#474747"
        value={cep}
        onChangeText={handleCepChange}
        keyboardType="numeric"
      />
      <View style={styles.row}>
        <TextInput
          placeholder="Cidade"
          style={[
            styles.input,
            focusedField === 'cidade' && styles.inputFocused,
            {width: '70%'},
          ]}
          onFocus={() => setFocusedField('cidade')}
          onBlur={() => setFocusedField(null)}
          placeholderTextColor="#474747"
          value={cidade}
          onChangeText={setCidade}
        />

        <TextInput
          placeholder="UF"
          style={[
            styles.input,
            focusedField === 'estado' && styles.inputFocused,
            {width: '20%'},
          ]}
          onFocus={() => setFocusedField('estado')}
          onBlur={() => setFocusedField(null)}
          placeholderTextColor="#474747"
          value={estado}
          onChangeText={setEstado}
        />
      </View>

      <TextInput
        placeholder="Logradouro"
        style={[
          styles.input,
          focusedField === 'logradouro' && styles.inputFocused,
        ]}
        onFocus={() => setFocusedField('logradouro')}
        onBlur={() => setFocusedField(null)}
        placeholderTextColor="#474747"
        value={logradouro}
        onChangeText={setLogradouro}
      />

      <View style={styles.row}>
        <TextInput
          placeholder="Número"
          style={[
            styles.inputHalf,
            focusedField === 'numero' && styles.inputFocused,
          ]}
          onFocus={() => setFocusedField('numero')}
          onBlur={() => setFocusedField(null)}
          placeholderTextColor="#474747"
          value={numero}
          onChangeText={setNumero}
          keyboardType="numeric"
        />

        <TextInput
          placeholder="Complemento"
          style={[
            styles.inputHalf,
            focusedField === 'complemento' && styles.inputFocused,
          ]}
          onFocus={() => setFocusedField('complemento')}
          onBlur={() => setFocusedField(null)}
          placeholderTextColor="#474747"
          value={complemento}
          onChangeText={setComplemento}
        />
      </View>

      <TextInput
        placeholder="Senha"
        style={[styles.input, focusedField === 'senha' && styles.inputFocused]}
        onFocus={() => setFocusedField('senha')}
        onBlur={() => setFocusedField(null)}
        placeholderTextColor="#474747"
        secureTextEntry={true}
        value={senha}
        onChangeText={setSenha}
      />

      <TextInput
        placeholder="Confirme Senha"
        style={[
          styles.input,
          focusedField === 'confirmaSenha' && styles.inputFocused,
        ]}
        onFocus={() => setFocusedField('confirmaSenha')}
        onBlur={() => setFocusedField(null)}
        placeholderTextColor="#474747"
        secureTextEntry={true}
        value={confirmaSenha}
        onChangeText={setConfirmaSenha}
      />
      <TouchableOpacity style={styles.button} onPress={handleCadastro}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    paddingVertical: 20,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 1,
  },
  backText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 50,
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
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
  },
  inputHalf: {
    width: '47%',
    height: 40,
    backgroundColor: '#F4F4F4',
    borderColor: '#B0B0B0',
    borderWidth: 2,
    marginBottom: 12,
    borderRadius: 30,
    paddingHorizontal: 8,
    color: '#000',
  },
});
