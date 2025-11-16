import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import {
  AppButton,
  ChartLegend,
  AppText,
  Card,
  ErrorView,
  LoadingView,
  MultiSeriesLineChart,
  ScatterChart,
  SectionHeader,
  StatCard,
  TrendChart,
  RefreshableScrollView,
} from '../../components';
import { activityRequest, connectStravaRequest, disconnectStravaRequest, syncStravaRequest } from '../../api/endpoints';
import { ActivityEffort } from '../../api/types';
import { useSubject } from '../../providers/SubjectProvider';
import { useAuth } from '../../providers/AuthProvider';
import { colors, spacing } from '../../theme';
import { formatDate, formatDecimal, formatDistance, formatMinutes, formatNumber, formatPace } from '../../utils/format';

function formatKilometers(value?: number | null) {
  const label = formatDecimal(value ?? null, 1);
  return label === '--' ? label : `${label} km`;
}

function formatWeeklyDuration(minutes?: number | null) {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) {
    return '--';
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = Math.round(minutes % 60);
    if (!remainder) {
      return `${hours}h`;
    }
    return `${hours}h ${remainder}m`;
  }
  return `${Math.round(minutes)} min`;
}

function formatHeartRateAxis(value: number) {
  if (!Number.isFinite(value)) {
    return '--';
  }
  return `${Math.round(value)} bpm`;
}

export function ActivityScreen() {
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const navigation = useNavigation();
  const requestSubject = subjectId && subjectId !== user?.id ? subjectId : undefined;

  const { data, isLoading, isError, refetch, isFetching, isRefetching } = useQuery({
    queryKey: ['activity', requestSubject || user?.id],
    queryFn: () => activityRequest({ athleteId: requestSubject }),
    enabled: Boolean(user?.id),
  });

  const handleConnect = async () => {
    if (!data?.strava?.canManage) return;
    const payload = await connectStravaRequest();
    await WebBrowser.openBrowserAsync(payload.url);
    refetch();
  };

  const handleDisconnect = async () => {
    await disconnectStravaRequest();
    refetch();
  };

  const handleSync = async () => {
    await syncStravaRequest();
    refetch();
  };

  if (isLoading || !data) {
    return <LoadingView />;
  }

  if (isError) {
    return <ErrorView message="Unable to load activity" onRetry={refetch} />;
  }

  const summary = data.summary;
  const efforts = (data.bestEfforts || []).filter((entry): entry is ActivityEffort => Boolean(entry));
  const mileageTrend = data.charts?.mileageTrend || [];
  const mileageSeries = [
    {
      id: 'distance',
      label: 'Distance (km)',
      color: colors.accent,
      data: mileageTrend.map((entry) => ({
        label: formatDate(entry.startTime, 'MMM D'),
        value: entry.distanceKm ?? 0,
      })),
    },
    {
      id: 'duration',
      label: 'Duration (min)',
      color: colors.accentStrong,
      strokeDasharray: '6,4',
      data: mileageTrend.map((entry) => ({
        label: formatDate(entry.startTime, 'MMM D'),
        value: entry.movingMinutes ?? 0,
      })),
    },
  ];
  const legendItems = mileageSeries
    .filter((serie) => serie.data.length)
    .map((serie) => ({ label: serie.label, color: serie.color || colors.accent }));
  const trainingTrend = (data.charts?.trainingLoad || []).map((entry) => ({
    label: formatDate(entry.startTime, 'MMM D'),
    value: entry.trainingLoad ?? 0,
  }));
  const pacePoints = (data.charts?.heartRatePace || []).map((point) => ({
    x: Number(point.paceSeconds),
    y: Number(point.heartRate),
    label: point.label,
  }));

  return (
    <RefreshableScrollView
      contentContainerStyle={styles.container}
      refreshing={isRefetching}
      onRefresh={refetch}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader title="Training summary" subtitle={data.subject?.name} />
      <View style={styles.statRow}>
        <StatCard label="Weekly distance" value={formatKilometers(summary?.weeklyDistanceKm)} />
        <StatCard label="Weekly duration" value={formatWeeklyDuration(summary?.weeklyDurationMin)} />
      </View>
      <View style={styles.statRow}>
        <StatCard label="Training load" value={formatNumber(summary?.trainingLoad)} />
        <StatCard label="VO₂ max" value={formatDecimal(summary?.vo2maxEstimate ?? null, 1)} />
      </View>
      <View style={styles.statRow}>
        <StatCard label="Avg pace" value={formatPace(summary?.avgPaceSeconds)} />
        <StatCard
          label="Longest run"
          value={formatKilometers(summary?.longestRunKm)}
          trend={summary?.longestRunName || 'Awaiting sync'}
        />
      </View>
      <Card>
        <SectionHeader title="Mileage vs duration" subtitle="Last sessions" />
        <MultiSeriesLineChart series={mileageSeries} yLabel="Volume" />
        <ChartLegend items={legendItems} />
      </Card>
      <Card>
        <SectionHeader title="Training load" subtitle="Recent sync" />
        <TrendChart data={trainingTrend} yLabel="Load" />
      </Card>
      <Card>
        <SectionHeader title="Pace vs heart rate" subtitle="Session comparison" />
        <ScatterChart
          data={pacePoints}
          xLabel="Pace (per km)"
          yLabel="Avg heart rate"
          xFormatter={(value) => formatPace(Number(value))}
          yFormatter={(value) => formatHeartRateAxis(Number(value))}
        />
      </Card>
      <Card>
        <SectionHeader title="Best efforts" subtitle="Auto-detected" />
        {efforts.length ? (
          efforts.map((effort) => (
            <View key={effort.label} style={styles.effortRow}>
              <AppText variant="body">{effort.label}</AppText>
              <View>
                <AppText variant="heading">{formatDistance(effort.distance || 0)}</AppText>
                <AppText variant="muted">{formatPace(effort.paceSeconds)}</AppText>
              </View>
            </View>
          ))
        ) : (
          <AppText variant="muted">Not enough data yet.</AppText>
        )}
      </Card>
      <Card>
        <SectionHeader title="Recent sessions" subtitle="Latest 3" action={
          <AppButton title="See all" variant="ghost" onPress={() => navigation.navigate('Sessions' as never)} />
        } />
        {data.sessions.slice(0, 3).map((session) => (
          <View key={session.id} style={styles.sessionRow}>
            <View>
              <AppText variant="body">{session.name}</AppText>
              <AppText variant="muted">{formatDate(session.startTime)} · {session.sportType}</AppText>
            </View>
            <View>
              <AppText variant="heading">{formatDistance(session.distance || 0)}</AppText>
              <AppText variant="muted">{formatPace(session.averagePace)}</AppText>
            </View>
          </View>
        ))}
      </Card>
      {data.strava?.enabled ? (
        <Card>
          <SectionHeader title="Strava" subtitle={data.strava.connected ? 'Connected' : 'Not linked'} />
          <AppText variant="muted">
            {data.strava.connected
              ? `Last sync ${data.strava.lastSync ? formatDate(data.strava.lastSync, 'MMM D, HH:mm') : 'pending'}`
              : 'Link to import outdoor sessions with splits.'}
          </AppText>
          <View style={styles.stravaActions}>
            {data.strava.canManage && !data.strava.connected ? (
              <AppButton title="Connect Strava" onPress={handleConnect} loading={isFetching} />
            ) : null}
            {data.strava.connected ? (
              <>
                <AppButton title="Sync now" variant="ghost" onPress={handleSync} loading={isFetching} />
                <AppButton title="Disconnect" variant="ghost" onPress={handleDisconnect} />
              </>
            ) : null}
          </View>
          {data.strava.requiresSetup ? (
            <AppText variant="muted" style={styles.warning}>
              Add your Strava API keys under Profile before connecting.
            </AppText>
          ) : null}
        </Card>
      ) : null}
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  effortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stravaActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  warning: {
    marginTop: spacing.sm,
    color: colors.warning,
  },
});
