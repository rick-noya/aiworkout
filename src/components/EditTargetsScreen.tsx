import * as React from 'react';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput, MD3DarkTheme } from 'react-native-paper';
import { useUnits } from './UnitsContext';

export default function EditTargetsScreen({ route, navigation }: { route: any; navigation: any }) {
  const { exercise, targets, onSave } = route.params;
  const [target_reps_min, setTargetRepsMin] = useState(targets.target_reps_min?.toString() || '');
  const [target_reps_max, setTargetRepsMax] = useState(targets.target_reps_max?.toString() || '');
  const [target_weight, setTargetWeight] = useState(targets.target_weight?.toString() || '');
  const [target_rpe, setTargetRpe] = useState(targets.target_rpe?.toString() || '');
  const [saving, setSaving] = useState(false);
  const { units, loading: unitsLoading } = useUnits();

  React.useEffect(() => {
    console.log('EditTargetsScreen: units context', { units, unitsLoading });
  }, [units, unitsLoading]);

  const handleSave = () => {
    setSaving(true);
    const weightFloat = parseFloat(target_weight);
    const weightKg = units === 'lb' ? weightFloat * 0.45359237 : weightFloat;
    const updatedTargets = {
      target_reps_min,
      target_reps_max,
      target_weight: weightKg,
      target_rpe,
    };
    console.log('EditTargetsScreen: Saving targets (converted to kg if needed)', { input: target_weight, units, weightKg, updatedTargets });
    if (onSave) {
      onSave(updatedTargets);
    }
    setSaving(false);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>Edit Targets</Text>
      <Text variant="titleMedium" style={{ marginBottom: 16 }}>{exercise.name}</Text>
      <TextInput
        label="Reps Min"
        value={target_reps_min}
        onChangeText={setTargetRepsMin}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Reps Max"
        value={target_reps_max}
        onChangeText={setTargetRepsMax}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label={`Weight (${units})`}
        value={target_weight}
        onChangeText={setTargetWeight}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Target RPE"
        value={target_rpe}
        onChangeText={setTargetRpe}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button mode="contained" onPress={handleSave} loading={saving} style={{ marginTop: 24 }}>
        Save
      </Button>
      <Button mode="outlined" onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>
        Cancel
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3DarkTheme.colors.background,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: 200,
    marginBottom: 12,
    backgroundColor: '#232323',
  },
}); 