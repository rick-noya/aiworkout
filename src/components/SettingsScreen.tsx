import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, MD3DarkTheme, ActivityIndicator, RadioButton } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const [username, setUsername] = useState('');
  const [units, setUnits] = useState<'kg' | 'lb'>('kg');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
        if (!user) {
          setError('Not logged in');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('username, default_units')
          .eq('id', user.id)
          .single();
        if (error) {
          setError('Failed to load profile');
          setLoading(false);
          return;
        }
        setUsername(data.username || '');
        setUnits(data.default_units === 'lb' ? 'lb' : 'kg');
      } catch (err) {
        setError('Unexpected error loading profile');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
      if (!user) {
        setError('Not logged in');
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from('profiles')
        .update({ username, default_units: units })
        .eq('id', user.id);
      if (error) {
        setError('Failed to update profile');
        setSaving(false);
        return;
      }
      setSuccess('Profile updated!');
      console.log('SettingsScreen: Profile updated', { username, units });
    } catch (err) {
      setError('Unexpected error updating profile');
    }
    setSaving(false);
  };

  const handleImportCSV = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
      if (result.type !== 'success' || !result.uri) {
        setImportResult('Import cancelled.');
        setImporting(false);
        return;
      }
      const response = await fetch(result.uri);
      const csvText = await response.text();
      const parsed = Papa.parse(csvText, { header: true });
      if (parsed.errors.length > 0) {
        setImportResult('CSV parse error: ' + parsed.errors.map(e => e.message).join(', '));
        setImporting(false);
        console.error('SettingsScreen: CSV parse error', parsed.errors);
        return;
      }
      // Assume columns: date, exercise_id, reps, weight_kg, rpe, partial_reps
      const rows = parsed.data;
      let imported = 0, failed = 0;
      for (const row of rows) {
        try {
          // You may need to adjust the mapping here to match your DB schema
          const { date, exercise_id, reps, weight_kg, rpe, partial_reps } = row;
          if (!date || !exercise_id || !reps || !weight_kg) {
            failed++;
            continue;
          }
          const { error } = await supabase.from('sets').insert([
            {
              workout_id: null, // You may want to match to a workout or create one
              exercise_id,
              reps: parseInt(reps, 10),
              weight_kg: parseFloat(weight_kg),
              rpe: rpe ? parseFloat(rpe) : null,
              partial_reps: partial_reps ? parseInt(partial_reps, 10) : null,
              created_at: date,
            },
          ]);
          if (error) {
            failed++;
            console.error('SettingsScreen: Failed to import row', row, error);
          } else {
            imported++;
          }
        } catch (err) {
          failed++;
          console.error('SettingsScreen: Unexpected error importing row', row, err);
        }
      }
      setImportResult(`Import complete: ${imported} rows imported, ${failed} failed.`);
      console.log('SettingsScreen: Import result', { imported, failed });
    } catch (err) {
      setImportResult('Unexpected error during import.');
      console.error('SettingsScreen: Unexpected error during import', err);
    }
    setImporting(false);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>Settings</Text>
      {loading ? (
        <ActivityIndicator animating={true} />
      ) : (
        <>
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />
          <Text style={{ marginTop: 16, marginBottom: 8 }}>Default Weight Units</Text>
          <RadioButton.Group onValueChange={value => setUnits(value as 'kg' | 'lb')} value={units}>
            <View style={styles.radioRow}>
              <RadioButton value="kg" /><Text style={styles.radioLabel}>kg</Text>
              <RadioButton value="lb" /><Text style={styles.radioLabel}>lb</Text>
            </View>
          </RadioButton.Group>
          {error && <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>}
          {success && <Text style={{ color: 'green', marginTop: 8 }}>{success}</Text>}
          <Button mode="contained" onPress={handleSave} loading={saving} style={{ marginTop: 24 }}>
            Save
          </Button>
          <Button mode="outlined" onPress={handleImportCSV} loading={importing} style={{ marginTop: 16 }}>
            Import Workouts from CSV
          </Button>
          {importResult && <Text style={{ color: importResult.includes('error') || importResult.includes('failed') ? 'red' : 'green', marginTop: 8 }}>{importResult}</Text>}
          <Button mode="outlined" onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>
            Back
          </Button>
        </>
      )}
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
    width: 240,
    marginBottom: 12,
    backgroundColor: '#232323',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    marginRight: 24,
    fontSize: 16,
  },
}); 