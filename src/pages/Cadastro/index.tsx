import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";

export default function Cadastro(): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);
  const [isFocusedUser, setIsFocusedUser] = useState(false);

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
      Alert.alert('As senhas não conferem');
      return;
    }
    // Lógica para realizar o cadastro
  }

  const userData = {
    nome,
    email,
    telefone,
    cep,
    logradouro,
    numero_casa: numero,
    complemento,
    senha,
  };

  fetch('https://devweb3.ok.etc.br/api/api_create.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message === "Usuário adicionado com sucesso.") {
        Alert.alert("Sucesso", data.message);
      } else {
        Alert.alert("Erro", data.message);
      }
    })
    .catch((error) => {
      console.error("Erro:", error);
      Alert.alert("Erro", "Não foi possível realizar o cadastro.");
    });

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
