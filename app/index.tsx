import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function App() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SchoolSync Parent</Text>
        <Text style={styles.subtitle}>Parent Portal</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.message}>Welcome to SchoolSync Parent App</Text>
        <Text style={styles.info}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976D2',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  info: {
    fontSize: 14,
    color: '#666',
  },
});
