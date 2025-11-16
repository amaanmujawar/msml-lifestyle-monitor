import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AppInput, AppText, Card } from '../../components';
import { colors } from '../../theme';
import { resetPasswordRequest } from '../../api/endpoints';
import { AuthStackParamList } from './AuthScreen';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation }: Props) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setFeedback(null);
    setLoading(true);
    try {
      const response = await resetPasswordRequest({ token: token.trim(), password });
      setFeedback(response.message);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <AppText variant="heading">Use your token</AppText>
        <AppInput
          label="Reset token"
          placeholder="Paste token"
          autoCapitalize="none"
          value={token}
          onChangeText={setToken}
        />
        <AppInput
          label="New password"
          placeholder="Minimum 8 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {feedback ? (
          <AppText variant="muted" style={styles.feedback}>
            {feedback}
          </AppText>
        ) : null}
        <AppButton title="Update password" onPress={handleSubmit} loading={loading} />
        <AppButton
          title="Back to sign in"
          variant="ghost"
          onPress={() => navigation.navigate('AuthLanding')}
          style={styles.secondary}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  feedback: {
    marginBottom: 12,
  },
  secondary: {
    marginTop: 8,
  },
});
