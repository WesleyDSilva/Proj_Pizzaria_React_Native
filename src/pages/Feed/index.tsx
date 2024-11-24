
import { StyleSheet, Text, View } from 'react-native';
import Feed_Pizza from './Feed_Pizza';

const Feed =  (): React.JSX.Element =>{
  return (
    <View style={styles.container}>
      <Feed_Pizza/>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title:{
    fontSize:22,
    fontWeight:'bold'
  }
});

export default Feed;