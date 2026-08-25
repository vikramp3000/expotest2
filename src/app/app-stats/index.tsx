import { useCallback, useState } from "react";
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import ExpoAndroidUsagestats, {
  getAggregatedUsageStats,
  UsageStatsIntervalType,
} from "expo-android-usagestats";

type Row = {
  packageName: string;
  totalTimeInForeground: number;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatMs(ms: number) {
  const minutes = Math.round(ms / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function AppStats() {
  const [status, setStatus] = useState("Tap load");
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    if (Platform.OS !== "android") {
      setStatus("Android only");
      return;
    }

    try {
      const allowed = await ExpoAndroidUsagestats.hasUsageStatsPermission();
      if (!allowed) {
        setStatus(
          "Usage access is off. Tap Grant, enable lockin2, come back, tap Load.",
        );
        setRows([]);
        return;
      }

      const stats = await getAggregatedUsageStats(
        startOfToday(),
        Date.now(),
        UsageStatsIntervalType.INTERVAL_DAILY,
      );

      const next = [...stats]
        .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground)
        .map((s) => ({
          packageName: s.packageName,
          totalTimeInForeground: s.totalTimeInForeground,
        }));

      setRows(next);
      setStatus(`${next.length} packages since midnight`);
    } catch (e) {
      setStatus(String(e));
      setRows([]);
    }
  }, []);

  const grant = useCallback(async () => {
    await ExpoAndroidUsagestats.requestUsageStatsPermission();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>App usage (today)</Text>
      <Text style={styles.status}>{status}</Text>
      <Button title="Grant usage access" onPress={grant} />
      <View style={{ height: 8 }} />
      <Button title="Load stats" onPress={load} />
      {rows.map((row) => (
        <Text key={row.packageName} style={styles.row}>
          {formatMs(row.totalTimeInForeground)} {row.packageName}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
  status: { marginVertical: 8 },
  row: { fontFamily: Platform.select({ android: "monospace" }), marginTop: 6 },
});
