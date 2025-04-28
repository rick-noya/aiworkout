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
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSet, setEditingSet] = useState<Set | null>(null);

  useEffect(() => {
    const fetchTodayExercises = async () => {
      setLoading(true);
      setError(null);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log("Looking for workout between:", {
        start: today.toISOString(),
        end: tomorrow.toISOString(),
      });

      // First get the workout for today
      const { data: workouts, error: workoutError } = await supabase
        .from("workouts")
        .select("id, scheduled_date")
        .gte("scheduled_date", today.toISOString())
        .lt("scheduled_date", tomorrow.toISOString());

      console.log("Workout query results:", { workouts, workoutError });

      if (workoutError) {
        console.error("Error fetching workout:", workoutError);
        setError("Failed to fetch workout");
        setLoading(false);
        return;
      }

      if (!workouts || workouts.length === 0) {
        console.log("No workout found for today");
        setExercises([]);
        setSets([]);
        setLoading(false);
        return;
      }

      const workoutId = workouts[0].id;
      console.log("Found workout with ID:", workoutId);

      // Get all sets for today's workout
      const { data: setsData, error: setsError } = await supabase
        .from("sets")
        .select("*")
        .eq("workout_id", workoutId)
        .order("created_at", { ascending: false });

      console.log("Sets query results:", { setsData, setsError });

      if (setsError) {
        console.error("Error fetching sets:", setsError);
        setError("Failed to fetch sets");
        setSets([]);
        setExercises([]);
        setLoading(false);
        return;
      }

      setSets(setsData || []);

      // Get unique exercise IDs
      const exerciseIds = [
        ...new Set(setsData?.map((set) => set.exercise_id) || []),
      ];
      console.log("Unique exercise IDs:", exerciseIds);

      // Then fetch exercise details
      const { data: exercises, error: exercisesError } = await supabase
        .from("exercises")
        .select("id, name")
        .in("id", exerciseIds);

      console.log("Exercises query results:", { exercises, exercisesError });

      if (exercisesError) {
        console.error("Error fetching exercise details:", exercisesError);
        setError("Failed to fetch exercise details");
        setExercises([]);
      } else {
        console.log("Final exercises:", exercises);
        setExercises(exercises || []);
      }
      setLoading(false);
    };

    fetchTodayExercises();
  }, []);

  const handleUpdateSet = async (set: Set) => {
    setLoading(true);
    const { error } = await supabase
      .from("sets")
      .update({
        reps: set.reps,
        weight_kg: set.weight_kg,
        rpe: set.rpe,
      })
      .eq("id", set.id);

    if (error) {
      console.error("Error updating set:", error);
      setError("Failed to update set");
    } else {
      setEditingSet(null);
      // Refresh the sets
      const { data: setsData } = await supabase
        .from("sets")
        .select("*")
        .eq("workout_id", set.workout_id)
        .order("created_at", { ascending: false });
      setSets(setsData || []);
    }
    setLoading(false);
  };

  const handleAddSet = async (exercise: Exercise) => {
    if (!sets.length) return;
    const workoutId = sets[0].workout_id;

    setLoading(true);
    const { error } = await supabase.from("sets").insert([
      {
        workout_id: workoutId,
        exercise_id: exercise.id,
        reps: 0,
        weight_kg: 0,
        rpe: null,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error adding set:", error);
      setError("Failed to add set");
    } else {
      // Refresh the sets
      const { data: setsData } = await supabase
        .from("sets")
        .select("*")
        .eq("workout_id", workoutId)
        .order("created_at", { ascending: false });
      setSets(setsData || []);
    }
    setLoading(false);
  };

  const getSetsForExercise = (exerciseId: string) => {
    return sets.filter((set) => set.exercise_id === exerciseId);
  };

  const calculateExerciseVolume = (exerciseId: string) => {
    const exerciseSets = getSetsForExercise(exerciseId);
    const totalVolume = exerciseSets.reduce(
      (sum, set) => sum + set.reps * set.weight_kg,
      0
    );
    const totalReps = exerciseSets.reduce((sum, set) => sum + set.reps, 0);
    const averageWeight = totalVolume / totalReps || 0;

    return {
      totalVolume,
      totalReps,
      averageWeight,
      setCount: exerciseSets.length,
    };
  };

  return (
    <Surface style={styles.container} elevation={2}>
      <Text variant="titleMedium" style={styles.title}>
        Today's Workout
      </Text>
      {loading ? (
        <ActivityIndicator animating={true} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : exercises.length === 0 ? (
        <Text style={styles.empty}>No exercises logged today</Text>
      ) : (
        <ScrollView>
          {exercises.map((exercise) => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              sets={sets}
              editingSet={editingSet}
              setEditingSet={setEditingSet}
              handleUpdateSet={handleUpdateSet}
              handleAddSet={handleAddSet}
              calculateExerciseVolume={calculateExerciseVolume}
            />
          ))}
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
  exerciseContainer: {
    marginBottom: 24,
  },
  exerciseTitle: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  volumeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  volumeText: {
    fontSize: 12,
    color: "#BB86FC",
  },
  setContainer: {
    marginBottom: 8,
  },
  setItem: {
    padding: 8,
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
  },
  setInputs: {
    gap: 8,
  },
  input: {
    backgroundColor: "#1E1E1E",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  addButton: {
    marginTop: 8,
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
