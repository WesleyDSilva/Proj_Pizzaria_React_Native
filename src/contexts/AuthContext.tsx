import React, {useState, createContext, ReactNode, useEffect} from 'react';
import {api} from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextData = {
  user: UserProps;
  isAuthenticated: boolean;
  signIn: (credentials: SignInProps) => Promise<void>;
  loadingAuth: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

type UserProps = {
  id: string;
  nome: string;
  email: string;
};

type AuthProviderProps = {
  children: ReactNode;
};

type SignInProps = {
  email: string;
  password: string;
};

// Tipo da resposta da API
type SignInResponse = {
  success: boolean;
  message: string;
  user?: UserProps; // 'user' é opcional
};

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({children}: AuthProviderProps) {
  const [user, setUser] = useState<UserProps>({
    id: '',
    nome: '',
    email: '',
  });

  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!user.nome;

  useEffect(() => {
    async function getUser() {
      const userInfo = await AsyncStorage.getItem('@QuickBite');
      let hasUser: UserProps = JSON.parse(userInfo || '{}');

      if (Object.keys(hasUser).length > 0) {
        setUser({
          id: hasUser.id,
          nome: hasUser.nome,
          email: hasUser.email,
        });
      }
      setLoading(false);
    }
    getUser();
  }, []);

  async function signIn({email, password}: SignInProps) {
    setLoadingAuth(true);

    try {
      // Logando os dados enviados
      console.log('Dados enviados para autenticação:', {email, password});

      // Envia a requisição de login
      const response = await api.post('/api/api_auth_hash.php', {
        email,
        senha: password,
      });

      // Corrigido: Acessar `response.data`
      const responseData = response.data;

      // Logando a resposta da API
      console.log('Resposta da API:', responseData);

      // Verifica se a resposta é bem-sucedida
      if (responseData.success) {
        if (responseData.user) {
          const {id, nome, email: responseEmail} = responseData.user;

          const data = {
            id,
            nome,
            email: responseEmail,
          };

          await AsyncStorage.setItem('@QuickBite', JSON.stringify(data));

          setUser({
            id,
            nome,
            email: responseEmail,
          });

          console.log('Autenticação bem-sucedida:', responseData.message);
        } else {
          console.log('Erro: Usuário não encontrado na resposta.');
        }
      } else {
        // Se a resposta não foi bem-sucedida
        console.log('Erro ao acessar! Resposta da API:', responseData.message);
      }
    } catch (err) {
      // Em caso de erro, exibe a mensagem de erro
      console.log('Erro ao acessar!', err);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function signOut() {
    await AsyncStorage.clear().then(() => {
      setUser({
        id: '',
        nome: '',
        email: '',
      });
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        signIn,
        loading,
        loadingAuth,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
