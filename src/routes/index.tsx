import React, {useContext} from "react";


import { View, ActivityIndicator } from "react-native";

import AppRoutes from "./app.routes";
import AuthRoutes from "./authroutes";

import { enableScreens } from 'react-native-screens';

import { AuthContext } from "../contexts/AuthContext";

enableScreens();

function Routes(){
    const {isAuthenticated} = useContext(AuthContext)
    const loading = false;

    if(loading){
        return(
            <View
                style={{
                    flex:1,
                    backgroundColor: '#fff',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <ActivityIndicator size={60} color='#000'/>
            </View>
    )
    }


    return(
        isAuthenticated ?  <AppRoutes/> : <AuthRoutes/>
    )

}

export default Routes;