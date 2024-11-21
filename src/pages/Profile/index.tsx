import React from 'react';
import { View, StyleSheet } from 'react-native';

import UserProfileForm from './UserProfileForm';

const Profile = (): React.JSX.Element => {
    return (
        <View style={styles.container}>
            <UserProfileForm />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff', // Cor de fundo para a página
    },
});

export default Profile;
