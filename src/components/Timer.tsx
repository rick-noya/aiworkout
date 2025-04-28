import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";

const TIME_OPTIONS = [30, 45, 60, 90, 120]; // seconds

export default function Timer() {
  const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[0]);
  const [remaining, setRemaining] = useState(TIME_OPTIONS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const doneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => prev - 1);
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (remaining === 0 && isRunning) {
      setIsRunning(false);
      setShowDone(true);
      doneTimeoutRef.current = setTimeout(() => setShowDone(false), 2000);
    }
    return () => {
      if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
    };
  }, [remaining, isRunning]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleSelectTime = (value: number) => {
    setSelectedTime(value);
    setRemaining(value);
    setIsRunning(false);
    setShowDone(false);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Timer</Text>
      <Picker
        selectedValue={selectedTime}
        style={styles.picker}
        enabled={!isRunning}
        onValueChange={handleSelectTime}
        dropdownIconColor="#BB86FC"
      >
        {TIME_OPTIONS.map((option) => (
          <Picker.Item key={option} label={`${option} sec`} value={option} />
        ))}
      </Picker>
      <Text style={styles.timeDisplay}>{remaining}s</Text>
      {showDone && <Text style={styles.doneText}>Done!</Text>}
      <View style={styles.buttonRow}>
        <IconButton
          icon="play"
          onPress={handleStart}
          disabled={isRunning || remaining === 0}
        />
        <IconButton icon="pause" onPress={handlePause} disabled={!isRunning} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#232323",
    borderRadius: 16,
    margin: 16,
  },
  picker: {
    width: 120,
    marginVertical: 8,
    color: "#fff",
    backgroundColor: "#1E1E1E",
  },
  timeDisplay: {
    fontSize: 32,
    color: "#BB86FC",
    marginVertical: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
  },
  doneText: {
    fontSize: 24,
    color: "#4CAF50",
    marginVertical: 8,
    fontWeight: "bold",
  },
});
