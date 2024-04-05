import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import PricerScreen from './pricer';





const Stack = createNativeStackNavigator();

const App = () => {
  return (

    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false // Başlığı gizlemek için
        }}>
        <Stack.Screen name="pricer" component={PricerScreen} />

      </Stack.Navigator>
    </NavigationContainer>

  );
};

export default App;
