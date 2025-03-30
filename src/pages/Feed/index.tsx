import {StyleSheet, Text, View, Image} from 'react-native';
import Feed_Pizza from './Feed_Pizza';

const Feed = (): React.JSX.Element => {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/Welcome_text.jpg')} />

      <Feed_Pizza />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'flex-start', // Alinha a imagem à esquerda
    justifyContent: 'center',
    paddingLeft: 10, // Ajusta o espaço à esquerda, caso necessário
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  image: {
    width: '100%', // Ajusta a largura para 100% da tela
    height: 200, // Altura fixa para a imagem
    resizeMode: 'cover', // Ajuste o modo de exibição da imagem
    marginBottom: 20, // Espaço abaixo da imagem
  },
});

export default Feed;
