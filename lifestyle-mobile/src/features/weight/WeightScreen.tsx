import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { weightRequest, deleteWeightEntryRequest } from '../../api/endpoints';
import { useSubject } from '../../providers/SubjectProvider';
import { useAuth } from '../../providers/AuthProvider';
import {
  AppButton,
  AppInput,
  AppText,
  Card,
  ErrorView,
  LoadingView,
  SectionHeader,
  TrendChart,
  RefreshableScrollView,
} from '../../components';
import { spacing } from '../../theme';
import { formatDate, formatNumber } from '../../utils/format';
import { useSyncQueue } from '../../providers/SyncProvider';

export function WeightScreen() {
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const { runOrQueue } = useSyncQueue();
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestSubject = subjectId && subjectId !== user?.id ? subjectId : undefined;
  const viewingOwnData = !requestSubject;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['weight', requestSubject || user?.id],
    queryFn: () => weightRequest({ athleteId: requestSubject }),
    enabled: Boolean(user?.id),
  });

  if (isLoading || !data) {
    return <LoadingView />;
  }

  if (isError) {
    return <ErrorView message="Unable to load weight" onRetry={refetch} />;
  }

  const trend = data.timeline.map((entry) => ({
    label: formatDate(entry.date, 'MMM D'),
    value: unit === 'kg' ? entry.weightKg || 0 : entry.weightLbs || 0,
  }));

  const handleAdd = async () => {
    if (!viewingOwnData) {
      setFeedback('Switch back to your dashboard to log weight.');
      return;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 500) {
      setFeedback('Enter a valid weight between 0 and 500.');
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        weight: parsed,
        unit,
        date: new Date().toISOString().slice(0, 10),
      };
      const result = await runOrQueue({ endpoint: '/api/weight', payload });
      if (result.status === 'sent') {
        await refetch();
        setFeedback('Weight saved.');
      } else {
        setFeedback('Saved offline. Syncs when you reconnect.');
      }
      setValue('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to save weight.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteWeightEntryRequest(id);
    refetch();
  };

  return (
    <RefreshableScrollView
      contentContainerStyle={styles.container}
      refreshing={isRefetching}
      onRefresh={refetch}
      showsVerticalScrollIndicator={false}
    >
      <Card>
        <SectionHeader title="Log weight" subtitle="Sync with goals" />
        {viewingOwnData ? (
          <>
            <AppInput
              label={`Weight (${unit})`}
              keyboardType="numeric"
              value={value}
              onChangeText={setValue}
            />
            <AppButton title={`Save in ${unit}`} onPress={handleAdd} loading={isSubmitting} />
            <AppButton
              title={`Switch to ${unit === 'kg' ? 'lb' : 'kg'}`}
              variant="ghost"
              onPress={() => setUnit((prev) => (prev === 'kg' ? 'lb' : 'kg'))}
            />
          </>
        ) : (
          <AppText variant="muted">
            Switch to your own dashboard to log weight. Coaches can only view athlete history.
          </AppText>
        )}
        {feedback ? (
          <AppText variant="muted" style={styles.feedback}>
            {feedback}
          </AppText>
        ) : null}
      </Card>
      <Card>
        <SectionHeader title="Recent" subtitle="Last 10 entries" />
        {data.recent.map((entry) => (
          <View key={entry.id} style={styles.entryRow}>
            <View>
              <AppText variant="body">{formatDate(entry.date)}</AppText>
              <AppText variant="muted">
                {entry.weightKg} kg · {entry.weightLbs} lb
              </AppText>
            </View>
            <AppButton title="Remove" variant="ghost" onPress={() => handleDelete(entry.id)} />
          </View>
        ))}
      </Card>
      <Card>
        <SectionHeader title="Timeline" subtitle={`Avg change ${formatNumber(data.stats?.weeklyChangeKg)} kg`} />
        <TrendChart data={trend} yLabel={unit} />
      </Card>
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  feedback: {
    marginTop: spacing.sm,
  },
});
