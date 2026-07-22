import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BrandHeader } from '@/components/BrandHeader';
import { Segmented } from '@/components/Segmented';
import { API_CONFIG_ERROR, SCHOOL_SLUG_CONFIG_ERROR } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { styles } from '@/lib/styles';
import type { LoginMode } from '@/lib/types';

export default function LoginScreen() {
  const { token, restoring, branding, loadingBranding, loginParentOrStudent, loginStaff } = useAuth();
  const [loginMode, setLoginMode] = useState<LoginMode>('PARENT_STUDENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!restoring && token) return <Redirect href="/" />;

  // Staff login doesn't need a school slug (resolved by the account's own
  // email, not by tenant), so this only gates the Parent/Student mode.
  const schoolConfigError = loginMode === 'PARENT_STUDENT' ? SCHOOL_SLUG_CONFIG_ERROR : null;
  const configError = API_CONFIG_ERROR || schoolConfigError;

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      if (!identifier.trim() || !password.trim()) {
        throw new Error(
          loginMode === 'PARENT_STUDENT'
            ? 'Please enter your phone/admission number and password.'
            : 'Please enter email and password.'
        );
      }
      if (loginMode === 'PARENT_STUDENT') {
        await loginParentOrStudent(identifier.trim(), password);
        return;
      }
      await loginStaff(identifier.trim(), password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  const theme = { backgroundColor: branding.primaryColor };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, theme]}>
        <BrandHeader branding={branding} loading={loadingBranding} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Login</Text>
        <Segmented
          value={loginMode}
          options={[
            { value: 'PARENT_STUDENT', label: 'Parent / Student' },
            { value: 'STAFF', label: 'Staff' },
          ]}
          onChange={setLoginMode}
          color={branding.primaryColor}
        />

        {loginMode === 'PARENT_STUDENT' ? (
          <>
            <Text style={styles.label}>Guardian Phone or Admission No.</Text>
            <TextInput
              autoCapitalize="none"
              placeholder="+91 98765 43210 or admission number"
              placeholderTextColor="#8a8a8a"
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Staff Email</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="admin@school.edu"
              placeholderTextColor="#8a8a8a"
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
            />
          </>
        )}

        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          placeholder="Enter password"
          placeholderTextColor="#8a8a8a"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {API_CONFIG_ERROR ? <Text style={styles.errorText}>{API_CONFIG_ERROR}</Text> : null}
        {schoolConfigError ? <Text style={styles.errorText}>{schoolConfigError}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.primaryButton, theme, configError && styles.primaryButtonDisabled]}
          onPress={handleLogin}
          disabled={loading || Boolean(configError)}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Login</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}
