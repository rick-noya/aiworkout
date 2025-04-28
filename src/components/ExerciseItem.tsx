import * as React from "react";
import { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, TextInput, Button, IconButton } from "react-native-paper";

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

interface ExerciseItemProps {
  exercise: Exercise;
  sets: Set[];
  editingSet: Set | null;
  setEditingSet: (set: Set | null) => void;
  handleUpdateSet: (set: Set) => void;
  handleAddSet: (exercise: Exercise) => void;
  calculateExerciseVolume: (exerciseId: string) => {
    totalVolume: number;
    totalReps: number;
    averageWeight: number;
    setCount: number;
  };
}

export default function ExerciseItem({
  exercise,
  sets,
  editingSet,
  setEditingSet,
  handleUpdateSet,
  handleAddSet,
  calculateExerciseVolume,
}: ExerciseItemProps) {
  const [expanded, setExpanded] = useState(false);
  const exerciseSets = sets.filter((set) => set.exercise_id === exercise.id);
  const setCount = exerciseSets.length;

  return (
    <View style={styles.exerciseContainer}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
      >
        <Text variant="titleSmall" style={styles.exerciseTitle}>
          {exercise.name}
        </Text>
        <View style={styles.headerInfo}>
          <Text style={styles.setCountText}>{setCount} sets</Text>
          <Text style={styles.targetRpeText}>Target RPE: 8</Text>
          <IconButton
            icon={expanded ? "chevron-up" : "chevron-down"}
            size={20}
          />
        </View>
      </Pressable>
      {expanded && (
        <View style={styles.setsContainer}>
          {exerciseSets.length === 0 ? (
            <Text style={styles.noSetsText}>No sets logged yet.</Text>
          ) : (
            exerciseSets.map((set) => (
              <View key={set.id} style={styles.setContainer}>
                {editingSet?.id === set.id ? (
                  <View style={styles.setInputs}>
                    <TextInput
                      label="Reps"
                      value={editingSet.reps.toString()}
                      onChangeText={(text) =>
                        setEditingSet({
                          ...editingSet,
                          reps: parseInt(text) || 0,
                        })
                      }
                      keyboardType="numeric"
                      style={styles.input}
                    />
                    <TextInput
                      label="Weight (kg)"
                      value={editingSet.weight_kg.toString()}
                      onChangeText={(text) =>
                        setEditingSet({
                          ...editingSet,
                          weight_kg: parseFloat(text) || 0,
                        })
                      }
                      keyboardType="numeric"
                      style={styles.input}
                    />
                    <TextInput
                      label="RPE"
                      value={editingSet.rpe?.toString() || ""}
                      onChangeText={(text) =>
                        setEditingSet({
                          ...editingSet,
                          rpe: text ? parseFloat(text) : null,
                        })
                      }
                      keyboardType="numeric"
                      style={styles.input}
                    />
                    <View style={styles.buttonRow}>
                      <Button
                        mode="outlined"
                        onPress={() => setEditingSet(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => handleUpdateSet(editingSet)}
                      >
                        Save
                      </Button>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.setItem,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => setEditingSet(set)}
                  >
                    <Text>
                      {set.reps} reps × {set.weight_kg}kg{" "}
                      {set.rpe ? `@ RPE ${set.rpe}` : ""}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))
          )}
          <Button
            mode="outlined"
            onPress={() => handleAddSet(exercise)}
            style={styles.addButton}
          >
            Add Set
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseContainer: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    backgroundColor: "#232323",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exerciseTitle: {
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
  },
  setCountText: {
    color: "#BB86FC",
    marginRight: 8,
  },
  targetRpeText: {
    color: "#BB86FC",
    marginRight: 8,
  },
  setsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  noSetsText: {
    color: "#BB86FC",
    marginBottom: 8,
    textAlign: "center",
  },
});
