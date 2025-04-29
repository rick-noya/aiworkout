import * as React from "react";
import { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import {
  Surface,
  Text,
  List,
  ActivityIndicator,
  TextInput,
  Button,
  Dialog,
  Portal,
  Menu,
  IconButton,
} from "react-native-paper";
import { supabase } from "../lib/supabase";
import ExerciseItem from "./ExerciseItem";
import { Picker } from "@react-native-picker/picker";
import { useUnits } from './UnitsContext';

interface Exercise {
  id: string;
  name: string;
}

interface Set {
  id: string;
  workout_id: string;
  exercise_id: string;
  reps: number;
  weight_kg: number;
  rpe: number | null;
  created_at: string;
}

export default function TodaysWorkout({ navigation }: { navigation: any }) {
  const [plannedExercises, setPlannedExercises] = useState<any[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const { units, loading: unitsLoading } = useUnits();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  React.useEffect(() => {
    console.log('TodayExercises: units context', { units, unitsLoading });
  }, [units, unitsLoading]);

  useEffect(() => {
    const fetchTodayWorkout = async () => {
      setLoading(true);
      setError(null);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const todayIso = today.toISOString();
      const tomorrowIso = tomorrow.toISOString();

      // Find today's workout
      const { data: workouts, error: workoutError } = await supabase
        .from('workouts')
        .select('id, scheduled_date')
        .gte('scheduled_date', todayIso)
        .lt('scheduled_date', tomorrowIso);
      if (workoutError) {
        setError('Failed to fetch workout');
        setLoading(false);
        return;
      }
      if (!workouts || workouts.length === 0) {
        setPlannedExercises([]);
        setSets([]);
        setWorkoutId(null);
        setLoading(false);
        console.log('TodayExercises: No workout found for today');
        return;
      }
      const workoutId = workouts[0].id;
      setWorkoutId(workoutId);
      // Fetch planned exercises/targets
      const { data: planned, error: plannedError } = await supabase
        .from('workout_exercises')
        .select('exercise_id, target_reps_min, target_reps_max, target_weight, target_rpe, exercises(name)')
        .eq('workout_id', workoutId);
      if (plannedError) {
        setError('Failed to fetch planned exercises');
        setLoading(false);
        return;
      }
      setPlannedExercises(planned || []);
      // Fetch sets for today
      const { data: setsData, error: setsError } = await supabase
        .from('sets')
        .select('*')
        .eq('workout_id', workoutId)
        .order('created_at', { ascending: false });
      if (setsError) {
        setError('Failed to fetch sets');
        setSets([]);
        setLoading(false);
        return;
      }
      setSets(setsData || []);
      setLoading(false);
      console.log('TodayExercises: plannedExercises', planned);
      console.log('TodayExercises: sets', setsData);
    };
    fetchTodayWorkout();
  }, []);

  const getSetsForExercise = (exerciseId: string) => {
    return sets.filter((set) => set.exercise_id === exerciseId);
  };

  const handleDeleteWorkout = async () => {
    setDeleting(true);
    try {
      if (!workoutId) return;
      await supabase.from('workout_exercises').delete().eq('workout_id', workoutId);
      await supabase.from('sets').delete().eq('workout_id', workoutId);
      const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
      if (error) {
        console.error('TodayExercises: Failed to delete workout', error);
      } else {
        console.log('TodayExercises: Workout deleted', workoutId);
        setPlannedExercises([]);
        setSets([]);
        setWorkoutId(null);
      }
    } catch (err) {
      console.error('TodayExercises: Unexpected error deleting workout', err);
    }
    setDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="titleMedium" style={styles.title}>
          Today's Workout
        </Text>
        {workoutId && plannedExercises.length > 0 && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton icon="cog" size={24} onPress={() => setMenuVisible(true)} accessibilityLabel="Workout options" />
            }
          >
            <Menu.Item onPress={() => {
              setMenuVisible(false);
              const selectedExercises = plannedExercises.map(e => ({ id: e.exercise_id, name: e.exercises?.name || e.exercise_id }));
              const exerciseTargets: Record<string, any> = {};
              plannedExercises.forEach(e => {
                exerciseTargets[e.exercise_id] = {
                  target_reps_min: e.target_reps_min?.toString() || '',
                  target_reps_max: e.target_reps_max?.toString() || '',
                  target_weight: e.target_weight?.toString() || '',
                  target_rpe_min: e.target_rpe_min?.toString() || '',
                  target_rpe_max: e.target_rpe_max?.toString() || '',
                };
              });
              navigation.navigate('ExerciseSelect', {
                date: new Date().toISOString(),
                workoutId,
                editMode: true,
                selectedExercises,
                exerciseTargets,
              });
            }} title="Edit Workout" leadingIcon="pencil" />
            <Menu.Item onPress={() => {
              setMenuVisible(false);
              setShowDeleteDialog(true);
            }} title="Delete Workout" leadingIcon="delete" />
          </Menu>
        )}
      </View>
      {workoutId && plannedExercises.length > 0 && (
        <Button mode="contained" style={{ marginBottom: 16, marginTop: 8 }} onPress={() => {
          // Start logging flow for the first exercise
          const first = plannedExercises[0];
          navigation.navigate('LogSet', {
            workoutId,
            exercise: { id: first.exercise_id, name: first.exercises?.name },
            date: new Date().toISOString(),
          });
        }}>
          Let's go!
        </Button>
      )}
      {loading ? (
        <ActivityIndicator animating={true} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : plannedExercises.length === 0 ? (
        <Text style={styles.empty}>No workout planned for today</Text>
      ) : (
        <ScrollView>
          {plannedExercises.map((item) => {
            const displayTargetWeight = units === 'lb'
              ? (parseFloat(item.target_weight) / 0.45359237).toFixed(1)
              : item.target_weight;
            return (
              <View key={item.exercise_id} style={styles.exerciseRow}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.exercises?.name || item.exercise_id}</Text>
                <Text style={{ color: '#BB86FC', fontSize: 14 }}>
                  Target: {item.target_reps_min} - {item.target_reps_max} reps, {displayTargetWeight} {units}, RPE {item.target_rpe}
                </Text>
              </View>
            );
          })}
          <Text style={{ textAlign: 'center', marginTop: 8, color: '#BB86FC' }}>
            {plannedExercises.length} exercise{plannedExercises.length !== 1 ? 's' : ''} planned
          </Text>
        </ScrollView>
      )}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Today's Workout</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete today's workout? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteWorkout} loading={deleting} color="red">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    margin: 0,
    marginHorizontal: 0,
    alignSelf: 'stretch',
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  exerciseRow: {
    marginBottom: 24,
    backgroundColor: "#232323",
    borderRadius: 8,
    padding: 12,
  },
  loader: {
    marginVertical: 16,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginVertical: 16,
  },
  empty: {
    textAlign: "center",
    marginVertical: 16,
    color: "#BB86FC",
  },
});
