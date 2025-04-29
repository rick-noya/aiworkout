import React from 'react';
import { View, Text } from 'react-native';

export default function InsightCard({ title = 'Insight' }) {
  return (
    <View style={{ width: 180, height: 120, backgroundColor: '#232323', borderRadius: 16, margin: 8, padding: 16, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#BB86FC', fontWeight: 'bold', marginBottom: 8 }}>{title}</Text>
      <View style={{ width: 120, height: 40, backgroundColor: '#333', borderRadius: 8 }} />
    </View>
  );
} 