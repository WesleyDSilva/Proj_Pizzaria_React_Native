// src/pages/UserProfileForm.tsx (ou o caminho correto para seu arquivo)

import React, {useEffect, useState, useContext} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import {AuthContext} from '../../contexts/AuthContext'; // Ajuste o caminho se necessário
import {buscaEndereco} from '../../services/enderecoService'; // Ajuste o caminho se necessário

const UserProfileForm = () => {
  const {user, signOut} = useContext(AuthContext);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState(''); // Embora enviado, a API PHP não o usa no UPDATE atual
  const [logradouro, setLogradouro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [cep, setCep] = useState('');
  const [complemento, setComplemento] = useState('');
  const [numeroCasa, setNumeroCasa] = useState(''); // Frontend usa numeroCasa
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingCep, setLoadingCep] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCepChange = async (value: string) => {
    const cepNumerico = value.replace(/\D/g, '');
    setCep(cepNumerico);

    setLogradouro(''); // Limpa campos dependentes do CEP ao iniciar nova busca
    setCidade('');
    setUf('');

    if (cepNumerico.length === 8) {
      try {
        setLoadingCep(true);
        setError('');
        const endereco = await buscaEndereco(cepNumerico);
        if (endereco && endereco.logradouro) {
          setLogradouro(endereco.logradouro);
          setCidade(endereco.cidade);
          setUf(endereco.estado); // API de CEP retorna 'estado', mapeamos para 'uf'
        } else {
          Alert.alert(
            'CEP não encontrado',
            'O CEP digitado não retornou um endereço válido.',
          );
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
        Alert.alert(
          'Erro ao buscar CEP',
          'Não foi possível obter o endereço. Verifique o CEP e sua conexão.',
        );
      } finally {
        setLoadingCep(false);
      }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setError('Usuário não autenticado. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await axios.get(
          `https://devweb3.ok.etc.br/api/api_get_user.php?id=${user.id}`,
        );
        const usuario = response.data;

        if (usuario && typeof usuario === 'object' && usuario.id) {
          // Adicionada verificação de tipo
          setNome(usuario.nome || '');
          setCpf(usuario.cpf || '');
          setLogradouro(usuario.logradouro || '');
          setCidade(usuario.cidade || '');
          setUf(usuario.UF || ''); // API get_user retorna 'UF'
          setCep(usuario.cep || '');
          setComplemento(usuario.complemento || '');
          setNumeroCasa(usuario.numero_casa || ''); // API get_user retorna 'numero_casa'
          setEmail(usuario.email || '');
          setTelefone(usuario.telefone || '');
        } else {
          setError(
            usuario?.message ||
              'Usuário não encontrado ou dados inválidos retornados pela API.',
          );
          // Limpar campos se o usuário não for encontrado
          setNome('');
          setCpf('');
          setLogradouro('');
          setCidade('');
          setUf('');
          setCep('');
          setComplemento('');
          setNumeroCasa('');
          setEmail('');
          setTelefone('');
        }
      } catch (err: any) {
        let errorMessage = 'Erro ao carregar os dados do usuário.';
        if (axios.isAxiosError(err) && err.response) {
          errorMessage =
            err.response.data?.message ||
            `Erro ${err.response.status} ao carregar dados.`;
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        console.error('Erro fetchUserData:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      // Apenas executa se user.id estiver disponível
      fetchUserData();
    } else {
      setLoading(false); // Se não tem user.id, não deve ficar carregando
      setError('Usuário não identificado para carregar perfil.');
    }
  }, [user?.id]);

  const handleSave = async () => {
    if (senha && senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não correspondem.');
      return;
    }

    if (!user?.id) {
      Alert.alert(
        'Erro',
        'Sessão expirada ou usuário inválido. Faça login novamente.',
      );
      return;
    }

    // Payload construído para corresponder ao que o isset() da API PHP api_update_user.php espera
    const dadosAtualizados = {
      id: user.id,
      nome: nome,
      // cpf: cpf, // A API PHP fornecida não valida 'cpf' no isset() nem o usa no UPDATE
      logradouro: logradouro,
      cidade: cidade,
      uf: uf, // API PHP api_update_user.php verifica $input['uf'] (minúsculo)
      cep: cep,
      complemento: complemento,
      numeroCasa: numeroCasa, // API PHP api_update_user.php verifica $input['numeroCasa'] (camelCase)
      email: email,
      telefone: telefone,
      ...(senha && {senha: senha}), // Envia 'senha' apenas se preenchida
    };

    console.log(
      'Dados a serem enviados para api_update_user:',
      JSON.stringify(dadosAtualizados, null, 2),
    );
    setSaving(true);
    setError('');

    try {
      // A API PHP api_update_user.php usa POST
      const response = await axios.post(
        'https://devweb3.ok.etc.br/api/api_update_user.php',
        dadosAtualizados,
      );
      console.log('Resposta de api_update_user:', response.data);
      if (response.data && response.data.success) {
        Alert.alert(
          'Sucesso',
          response.data.message || 'Dados atualizados com sucesso.',
        );
        setSenha('');
        setConfirmarSenha('');
      } else {
        Alert.alert(
          'Erro ao Atualizar',
          response.data.message || 'Não foi possível atualizar os dados.',
        );
      }
    } catch (err: any) {
      let errorMessage = 'Erro ao atualizar os dados.';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage =
          err.response.data?.message ||
          `Erro ${err.response.status} ao salvar.`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      Alert.alert('Erro', errorMessage);
      console.error('Erro handleSave:', err.response ? err.response.data : err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA831" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>MEU PERFIL</Text>

      {error && !loading && <Text style={styles.errorTextGlobal}>{error}</Text>}

      <Text style={styles.label}>Nome Completo:</Text>
      <TextInput
        style={styles.input}
        value={nome}
        onChangeText={setNome}
        placeholder="Digite seu nome completo"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>CPF:</Text>
      <TextInput
        style={styles.input}
        value={cpf}
        onChangeText={setCpf}
        placeholder="000.000.000-00"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
      />

      <Text style={styles.label}>CEP:</Text>
      <TextInput
        style={styles.input}
        value={cep}
        onChangeText={handleCepChange}
        placeholder="Digite seu CEP (só números)"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        maxLength={8}
      />
      {loadingCep && (
        <ActivityIndicator
          size="small"
          color="#FFA831"
          style={styles.cepLoadingIndicator}
        />
      )}

      <Text style={styles.label}>Logradouro:</Text>
      <TextInput
        style={styles.input}
        value={logradouro}
        onChangeText={setLogradouro}
        placeholder="Rua, Avenida..."
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Número:</Text>
      <TextInput
        style={styles.input}
        value={numeroCasa}
        onChangeText={setNumeroCasa}
        placeholder="Nº"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Complemento:</Text>
      <TextInput
        style={styles.input}
        value={complemento}
        onChangeText={setComplemento}
        placeholder="Apto, Bloco (opcional)"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Cidade:</Text>
      <TextInput
        style={styles.input}
        value={cidade}
        onChangeText={setCidade}
        placeholder="Cidade"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>UF:</Text>
      <TextInput
        style={styles.input}
        value={uf}
        onChangeText={setUf}
        placeholder="Estado (Ex: SP)"
        placeholderTextColor="#aaa"
        maxLength={2}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Email:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="seuemail@exemplo.com"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Telefone:</Text>
      <TextInput
        style={styles.input}
        value={telefone}
        onChangeText={setTelefone}
        placeholder="(00) 90000-0000"
        placeholderTextColor="#aaa"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>
        Nova Senha (deixe em branco para não alterar):
      </Text>
      <TextInput
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        placeholder="Digite a nova senha"
        placeholderTextColor="#aaa"
        autoComplete="new-password"
      />

      <Text style={styles.label}>Confirmar Nova Senha:</Text>
      <TextInput
        style={styles.input}
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        secureTextEntry
        placeholder="Confirme a nova senha"
        placeholderTextColor="#aaa"
        editable={!!senha}
      />

      <TouchableOpacity
        style={[styles.buttonContainer2, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText2}>SALVAR ALTERAÇÕES</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={signOut}
        disabled={saving}>
        <Text style={styles.buttonText}>SAIR DO APLICATIVO</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  contentContainer: {
    // Para adicionar padding ao conteúdo do ScrollView
    paddingHorizontal: 20,
    paddingBottom: 30, // Espaço no final
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 20, // Adicionado marginTop
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    color: '#454545',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    height: 48,
    backgroundColor: '#fff',
    borderColor: '#d0d0d0',
    borderWidth: 1,
    marginBottom: 18,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  inputDisabled: {
    // Pode ser removido se todos os campos forem editáveis
    backgroundColor: '#e9ecef',
    color: '#555',
  },
  cepLoadingIndicator: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: -10, // Puxa um pouco para cima
  },
  buttonContainer: {
    marginTop: 20, // Aumentado marginTop
    marginBottom: 20,
    borderRadius: 25,
    backgroundColor: 'transparent',
    borderColor: '#FFA831',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFA831',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer2: {
    marginTop: 10, // Diminuído marginTop
    marginBottom: 15,
    borderRadius: 25,
    backgroundColor: '#FFA831',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 2,
  },
  buttonText2: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#fabf7a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorTextGlobal: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 15,
  },
});

export default UserProfileForm;
