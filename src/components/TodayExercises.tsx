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
} from "react-native-paper";
import { supabase } from "../lib/supabase";
import ExerciseItem from "./ExerciseItem";
import { Picker } from "@react-native-picker/picker";

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
        .select('exercise_id, target_reps_min, target_reps_max, target_weight, target_rpe_min, target_rpe_max, exercises(name)')
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

  return (
    <Surface style={styles.container} elevation={2}>
      <Text variant="titleMedium" style={styles.title}>
        Today's Workout
      </Text>
      {workoutId && plannedExercises.length > 0 && (
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
            return (
              <View key={item.exercise_id} style={styles.exerciseRow}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.exercises?.name || item.exercise_id}</Text>
                <Text>Target Reps: {item.target_reps_min} - {item.target_reps_max}</Text>
                <Text>Target Weight: {item.target_weight} kg</Text>
                <Text>Target RPE: {item.target_rpe_min} - {item.target_rpe_max}</Text>
                <Button mode="outlined" style={{ marginTop: 8 }} onPress={() => navigation.navigate('LogSet', { workoutId, exercise: { id: item.exercise_id, name: item.exercises?.name }, date: new Date().toDateString() })}>
                  Log Sets
                </Button>
                {setsForExercise.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: '#BB86FC' }}>Logged Sets:</Text>
                    {setsForExercise.map((set) => (
                      <Text key={set.id} style={{ fontSize: 13 }}>
                        {set.reps} reps × {set.weight_kg}kg{set.rpe ? ` @ RPE ${set.rpe}` : ''}
                      </Text>
                    ))}
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
