import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importar o hook de navegação

export default function Cadastro() {
  const navigation = useNavigation(); // Usar o hook de navegação

  const [isFocused, setIsFocused] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');

  function handleCadastro() {
    if (senha !== confirmaSenha) {
      alert('As senhas não conferem');
      return;
    }
    // Lógica para realizar o cadastro
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastro</Text>

      {/* Campos de Cadastro */}
      <TextInput
        placeholder="Nome Completo"
        style={[styles.input, isFocused && styles.inputFocused]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#474747"
        value={nome}
        onChangeText={setNome}
      />
      
      <TextInput
        placeholder="E-mail"
        style={[styles.input, isFocused && styles.inputFocused]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#474747"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Telefone Celular"
        style={[styles.input, isFocused && styles.inputFocused]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#474747"
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
      />

      <TextInput
        placeholder="CEP"
        style={[styles.input, isFocused && styles.inputFocused]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#474747"
        value={cep}
        onChangeText={setCep}
        keyboardType="numeric"
      />

      <TextInput
        placeholder="Logradouro"
        style={[styles.input, isFocused && styles.inputFocused]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#474747"
        value={logradouro}
        onChangeText={setLogradouro}
      />

      <View style={styles.row}>
        <TextInput
          placeholder="Número"
          style={[styles.inputHalf, isFocused && styles.inputFocused]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#474747"
          value={numero}
          onChangeText={setNumero}
          keyboardType="numeric"
        />
        
        <TextInput
          placeholder="Complemento"
          style={[styles.inputHalf, isFocused && styles.inputFocused]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#474747"
          value={complemento}
          onChangeText={setComplemento}
        />
      </View>

      <TextInput
        placeholder="Senha"
        style={[styles.input, isFocused && styles.inputFocused]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#474747"
        secureTextEntry={true}
        value={senha}
        onChangeText={setSenha}
      />

      <TextInput
        placeholder="Confirme Senha"
        style={[styles.input, isFocused && styles.inputFocused]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#474747"
        secureTextEntry={true}
        value={confirmaSenha}
        onChangeText={setConfirmaSenha}
      />

      {/* Botão de Cadastro */}
      <TouchableOpacity style={styles.button} onPress={handleCadastro}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>

      {/* Botão Voltar */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Voltar para Login</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
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
    borderColor: '#ff0000', // Cor da borda quando o campo está focado
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
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
});


