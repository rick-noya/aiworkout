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

  React.useEffect(() => {
    console.log('TodayExercises: units context', { units, unitsLoading });
  }, [units, unitsLoading]);

  useEffect(() => {
    const fetchTodayWorkout = async () => {
      setLoading(true);
      setError(null);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateStr = today.toDateString();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find today's workout
      const { data: workouts, error: workoutError } = await supabase
        .from('workouts')
        .select('id, scheduled_date')
        .gte('scheduled_date', today.toISOString())
        .lt('scheduled_date', tomorrow.toISOString());
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
      <Text variant="titleMedium" style={styles.title}>
        Today's Workout
      </Text>
      {workoutId && plannedExercises.length > 0 && (
        <>
          <Button mode="contained" style={{ marginBottom: 16 }} onPress={() => {
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
              date: new Date().toDateString(),
              workoutId,
              editMode: true,
              selectedExercises,
              exerciseTargets,
            });
          }}>
            Edit Workout
          </Button>
          <Button mode="contained" style={{ marginBottom: 16, backgroundColor: 'red' }} onPress={() => setShowDeleteDialog(true)}>
            Delete Today's Workout
          </Button>
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
        </>
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
            const setsForExercise = getSetsForExercise(item.exercise_id);
            const displayTargetWeight = units === 'lb'
              ? (parseFloat(item.target_weight) / 0.45359237).toFixed(1)
              : item.target_weight;
            return (
              <View key={item.exercise_id} style={styles.exerciseRow}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.exercises?.name || item.exercise_id}</Text>
                <Text>Target Reps: {item.target_reps_min} - {item.target_reps_max}</Text>
                <Text>Target Weight: {displayTargetWeight} {units}</Text>
                <Text>Target RPE: {item.target_rpe}</Text>
                <Button mode="outlined" style={{ marginTop: 8 }} onPress={() => navigation.navigate('LogSet', { workoutId, exercise: { id: item.exercise_id, name: item.exercises?.name }, date: new Date().toDateString() })}>
                  Log Sets
                </Button>
                {setsForExercise.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: '#BB86FC' }}>Logged Sets:</Text>
                    {setsForExercise.map((set) => {
                      const displaySetWeight = units === 'lb'
                        ? (set.weight_kg / 0.45359237).toFixed(1)
                        : set.weight_kg.toFixed(1);
                      return (
                        <Text key={set.id} style={{ fontSize: 13 }}>
                          {set.reps} reps × {displaySetWeight}{units}{set.rpe ? ` @ RPE ${set.rpe}` : ''}
                        </Text>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
    width: 340,
    maxWidth: "95%",
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
