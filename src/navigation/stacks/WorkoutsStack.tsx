import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

// Import screens (use placeholders if missing)
import CreateWorkoutScreen from '../../components/CreateWorkoutScreen';
import ExerciseSelectScreen from '../../components/ExerciseSelectScreen';
import WorkoutSummaryScreen from '../../components/WorkoutSummaryScreen';
import WorkoutDetailScreen from '../../components/WorkoutDetailScreen';
import LogSetScreen from '../../components/LogSetScreen';
// TODO: Implement or import WorkoutListScreen
const WorkoutListScreen = () => {
  React.useEffect(() => {
    console.log('[WorkoutsStack] Mounted WorkoutListScreen');
  }, []);
  return null;
};

const Stack = createNativeStackNavigator();

const WorkoutsStack = () => {
  const navigation = useNavigation();
  React.useEffect(() => {
    console.log('[WorkoutsStack] Mounted');
  }, []);
  return (
    <Stack.Navigator initialRouteName="WorkoutList">
      <Stack.Screen name="WorkoutList" component={WorkoutListScreen} options={{ title: 'Workouts' }} />
      <Stack.Screen name="CreateWorkout" component={CreateWorkoutScreen} options={{ title: 'Create Workout' }} />
      <Stack.Screen name="ExerciseSelect" component={ExerciseSelectScreen} options={{ title: 'Select Exercise' }} />
      <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} options={{ title: 'Workout Summary' }} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: 'Workout Details' }} />
      <Stack.Screen name="LogSet" component={LogSetScreen} options={{ title: 'Log Set' }} />
    </Stack.Navigator>
  );
};

export default WorkoutsStack; 