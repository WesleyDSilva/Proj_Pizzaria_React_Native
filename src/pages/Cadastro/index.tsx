import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { api_CEP } from "../../services/api_CEP";
import { buscaEndereco } from "../../services/enderecoService";


export default function Cadastro(): React.JSX.Element {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [nome, setNome] = useState('');
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

  const handleCepChange = async (value: string) =>{
    setCep(value);
    if(value.length === 8){
      try{
        const endereco = await buscaEndereco(value);
        setLogradouro(endereco.logradouro)
        setCidade(endereco.cidade)
        setEstado(endereco.estado)
      } catch (error:any){
        Alert.alert('Erro', error.message);
      }
    }
  }

  async function handleCadastro() {
    if (senha !== confirmaSenha) {
      Alert.alert('As senhas não conferem');
      return;
    }
  
    try {
      const response = await fetch('https://jzlpwyuqtdfsdbiufigl.supabase.co/rest/v1/Cliente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bHB3eXVxdGRmc2RiaXVmaWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyMTUzODQsImV4cCI6MjA0NDc5MTM4NH0.73UgUM8eFeZ3W5iGP2X3jzvc4I0r-CIK3i61e70BKoE',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bHB3eXVxdGRmc2RiaXVmaWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyMTUzODQsImV4cCI6MjA0NDc5MTM4NH0.73UgUM8eFeZ3W5iGP2X3jzvc4I0r-CIK3i61e70BKoE',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          nome,
          telefone,
          email,
          senha,
          complemento,      
          cep,
          cidade,
          estado,
          logradouro,
          numero,
          
          
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao enviar dados ao Supabase');
      }
      
      const result = await response.json();
      Alert.alert('Sucesso', 'Dados enviados com sucesso!');
      console.log('Resposta:', result);
    } catch (error:any) {
      Alert.alert('Erro', 'Erro ao cadastrar: ' + error.message);
      console.error(error);
    }
  }



  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Campos de entrada para dados do formulário */}
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
        style={[styles.input, focusedField === 'telefone' && styles.inputFocused]}
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
          style={[styles.input, focusedField === 'cidade' && styles.inputFocused, {width:'70%'}]}
          onFocus={() => setFocusedField('cidade')}
          onBlur={() => setFocusedField(null)}
          placeholderTextColor="#474747"
          value={cidade}
          onChangeText={setCidade}
        />

        <TextInput
          placeholder="UF"
          style={[styles.input, focusedField === 'estado' && styles.inputFocused, {width:'20%'}]}
          onFocus={() => setFocusedField('estado')}
          onBlur={() => setFocusedField(null)}
          placeholderTextColor="#474747"
          value={estado}
          onChangeText={setEstado}
        />
      </View>



      <TextInput
        placeholder="Logradouro"
        style={[styles.input, focusedField === 'logradouro' && styles.inputFocused]}
        onFocus={() => setFocusedField('logradouro')}
        onBlur={() => setFocusedField(null)}
        placeholderTextColor="#474747"
        value={logradouro}
        onChangeText={setLogradouro}
      />

      <View style={styles.row}>
        <TextInput
          placeholder="Número"
          style={[styles.inputHalf, focusedField === 'numero' && styles.inputFocused]}
          onFocus={() => setFocusedField('numero')}
          onBlur={() => setFocusedField(null)}
          placeholderTextColor="#474747"
          value={numero}
          onChangeText={setNumero}
          keyboardType="numeric"
        />
        
        <TextInput
          placeholder="Complemento"
          style={[styles.inputHalf, focusedField === 'complemento' && styles.inputFocused]}
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
        style={[styles.input, focusedField === 'confirmaSenha' && styles.inputFocused]}
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
  },  row: {
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
