// src/pages/Perfil.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';

const Perfil = () => {
  const [foto, setFoto] = useState(null); // Estado para a foto
  const [nomeCompleto, setNomeCompleto] = useState(''); // Nome completo
  const [telefone, setTelefone] = useState(''); // Telefone
  const [email, setEmail] = useState(''); // Email
  const [cep, setCep] = useState(''); // CEP
  const [logradouro, setLogradouro] = useState(''); // Logradouro
  const [numero, setNumero] = useState(''); // Número

  function handleSalvar() {
    // Lógica para salvar as informações do perfil
    alert('Perfil salvo com sucesso!');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>MEU PERFIL</Text>

      {/* Campo para foto */}
      <TouchableOpacity style={styles.photoContainer}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.photo} />
        ) : (
          <Text style={styles.photoText}>Adicionar Foto</Text>
        )}
      </TouchableOpacity>

      {/* Campos de informações pessoais */}
      <TextInput
        placeholder="Nome Completo"
        style={styles.input}
        value={nomeCompleto}
        onChangeText={setNomeCompleto}
      />

      <TextInput
        placeholder="Telefone Celular"
        style={styles.input}
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
      />

      <TextInput
        placeholder="E-mail"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.row}>
        <TextInput
          placeholder="CEP"
          style={styles.inputHalf}
          value={cep}
          onChangeText={setCep}
          keyboardType="numeric"
        />

        <TextInput
          placeholder="Logradouro"
          style={styles.inputHalf}
          value={logradouro}
          onChangeText={setLogradouro}
        />
      </View>

      <TextInput
        placeholder="Número"
        style={styles.input}
        value={numero}
        onChangeText={setNumero}
        keyboardType="numeric"
      />

      {/* Botão de Salvar */}
      <TouchableOpacity style={styles.button} onPress={handleSalvar}>
        <Text style={styles.buttonText}>Salvar</Text>
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
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#B0B0B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  photoText: {
    color: '#fff',
    fontWeight: 'bold',
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

export default Perfil;

