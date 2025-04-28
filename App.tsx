import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3DarkTheme, Appbar } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './src/components/MainScreen';
import ExerciseSelectScreen from './src/components/ExerciseSelectScreen';
import LogSetScreen from './src/components/LogSetScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={MD3DarkTheme}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              header: (props) => (
                <Appbar.Header>
                  <Appbar.Content title={props.options.title || 'AiWeightTrainer'} />
                </Appbar.Header>
              ),
            }}
          >
            <Stack.Screen name="Main" component={MainScreen} options={{ title: 'AiWeightTrainer' }} />
            <Stack.Screen name="ExerciseSelect" component={ExerciseSelectScreen} options={{ title: 'Select Exercise' }} />
            <Stack.Screen name="LogSet" component={LogSetScreen} options={{ title: 'Log Set' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
