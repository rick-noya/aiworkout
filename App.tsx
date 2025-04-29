import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  Appbar,
  Modal,
  Portal,
  Text,
  IconButton,
} from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainScreen from "./src/components/MainScreen";
import ExerciseSelectScreen from "./src/components/ExerciseSelectScreen";
import LogSetScreen from "./src/components/LogSetScreen";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "./src/lib/supabase";
import AuthScreen from "./src/components/AuthScreen";
import ResetPasswordScreen from "./src/components/ResetPasswordScreen";
import { Linking } from "react-native";
import CreateWorkoutScreen from "./src/components/CreateWorkoutScreen";
import EditTargetsScreen from "./src/components/EditTargetsScreen";
import WorkoutSummaryScreen from "./src/components/WorkoutSummaryScreen";
import WorkoutDetailScreen from "./src/components/WorkoutDetailScreen";

const Stack = createNativeStackNavigator();
const TIME_OPTIONS = [30, 45, 60, 90, 120];

type TimerModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onStart: (seconds: number) => void;
  initialTime: number;
};

function TimerModal({
  visible,
  onDismiss,
  onStart,
  initialTime,
}: TimerModalProps) {
  const [selectedTime, setSelectedTime] = useState(
    initialTime || TIME_OPTIONS[0]
  );
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsRunning(false);
    }
  }, [visible]);

  const handleStart = () => {
    setIsRunning(true);
    onStart(selectedTime);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={{
        margin: 24,
        backgroundColor: "#232323",
        borderRadius: 16,
        alignItems: "center",
        padding: 16,
      }}
    >
      <Text variant="titleMedium">Timer</Text>
      <Text style={{ marginVertical: 8 }}>Select time:</Text>
      <Picker
        selectedValue={selectedTime}
        enabled={!isRunning}
        onValueChange={(itemValue) => setSelectedTime(itemValue)}
        style={{
          width: 120,
          fontSize: 18,
          marginBottom: 16,
          color: "#fff",
          backgroundColor: "#1E1E1E",
          borderRadius: 8,
        }}
        dropdownIconColor="#BB86FC"
      >
        {TIME_OPTIONS.map((option) => (
          <Picker.Item key={option} label={`${option} sec`} value={option} />
        ))}
      </Picker>
      <Appbar.Action icon="play" onPress={handleStart} disabled={isRunning} />
    </Modal>
  );
}

const linking = {
  prefixes: ["exp://10.0.0.93:8081"],
  config: {
    screens: {
      Main: "main",
      ExerciseSelect: "exercise-select",
      LogSet: "log-set",
      ResetPassword: "reset-password",
    },
  },
};

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerValue, setTimerValue] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const doneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setSessionChecked(true);
    };
    initSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (timerRunning && !timerPaused && timerValue > 0) {
      intervalRef.current = setInterval(() => {
        setTimerValue((prev) => prev - 1);
      }, 1000);
    } else if ((!timerRunning || timerPaused) && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, timerPaused]);

  useEffect(() => {
    if (timerValue === 0 && timerRunning) {
      setTimerRunning(false);
      setShowDone(true);
      setTimerPaused(false);
      doneTimeoutRef.current = setTimeout(() => setShowDone(false), 2000);
    }
    return () => {
      if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
    };
  }, [timerValue, timerRunning]);

  const handleTimerStart = (seconds: number) => {
    setTimerValue(seconds);
    setTimerRunning(true);
    setShowDone(false);
    setTimerPaused(false);
  };

  const handlePause = () => setTimerPaused(true);
  const handleResume = () => setTimerPaused(false);
  const handleStop = () => {
    setTimerRunning(false);
    setTimerPaused(false);
    setTimerValue(0);
    setShowDone(false);
  };

  if (!sessionChecked) {
    return null; // or splash screen
  }

  if (!session) {
    return (
      <PaperProvider theme={MD3DarkTheme}>
        <SafeAreaProvider>
          <NavigationContainer
            linking={linking}
            fallback={<Text>Loading...</Text>}
          >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Auth" component={AuthScreen} />
              <Stack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={MD3DarkTheme}>
      <SafeAreaProvider>
        <NavigationContainer
          linking={linking}
          fallback={<Text>Loading...</Text>}
        >
          <Stack.Navigator
            screenOptions={{
              header: (props) => (
                <>
                  <Appbar.Header>
                    <Appbar.Content
                      title={props.options.title || "AiWeightTrainer"}
                    />
                    {showDone ? (
                      <Text
                        style={{
                          color: "#4CAF50",
                          fontWeight: "bold",
                          marginRight: 8,
                        }}
                      >
                        Done!
                      </Text>
                    ) : timerRunning && timerValue > 0 ? (
                      timerPaused ? (
                        <>
                          <IconButton
                            icon="play"
                            onPress={handleResume}
                            accessibilityLabel="Resume timer"
                          />
                          <IconButton
                            icon="close"
                            onPress={handleStop}
                            accessibilityLabel="Stop timer"
                          />
                        </>
                      ) : (
                        <Text
                          style={{
                            color: "#BB86FC",
                            fontWeight: "bold",
                            marginRight: 8,
                          }}
                          onPress={handlePause}
                          accessibilityRole="button"
                        >
                          {timerValue}s
                        </Text>
                      )
                    ) : null}
                    <Appbar.Action
                      icon="timer"
                      onPress={() => setTimerVisible(true)}
                    />
                  </Appbar.Header>
                  <Portal>
                    <TimerModal
                      visible={timerVisible}
                      onDismiss={() => setTimerVisible(false)}
                      onStart={handleTimerStart}
                      initialTime={timerValue || TIME_OPTIONS[0]}
                    />
                  </Portal>
                </>
              ),
            }}
          >
            <Stack.Screen
              name="Main"
              component={MainScreen}
              options={{ title: "AiWeightTrainer" }}
            />
            <Stack.Screen
              name="CreateWorkout"
              component={CreateWorkoutScreen}
              options={{ title: "Create Workout" }}
            />
            <Stack.Screen
              name="ExerciseSelect"
              component={ExerciseSelectScreen}
              options={{ title: "Select Exercise" }}
            />
            <Stack.Screen
              name="LogSet"
              component={LogSetScreen}
              options={{ title: "Log Set" }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ title: "Reset Password" }}
            />
            <Stack.Screen
              name="EditTargets"
              component={EditTargetsScreen}
              options={{ title: "Edit Targets" }}
            />
            <Stack.Screen
              name="WorkoutSummary"
              component={WorkoutSummaryScreen}
              options={{ title: "Workout Summary" }}
            />
            <Stack.Screen
              name="WorkoutDetail"
              component={WorkoutDetailScreen}
              options={{ title: "Workout Details" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
