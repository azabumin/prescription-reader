import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';

import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { deleteHistoryEntry, listHistory, type HistoryEntry } from '../lib/history';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { TIME_SLOTS } from '../types';
import type { Lang } from '../types';

function formatDate(iso: string, lang: Lang): string {
  try {
    return new Date(iso).toLocaleString(lang);
  } catch {
    return iso;
  }
}

export default function HistoryScreen() {
  const [lang] = useState<Lang>(detectDefaultLang());
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const t = STRINGS[lang];

  useFocusEffect(
    useCallback(() => {
      listHistory().then(setEntries);
    }, [])
  );

  async function handleDelete(id: string) {
    const next = await deleteHistoryEntry(id);
    setEntries(next);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href="/" style={styles.backLink}>
        ← {t.appTitle}
      </Link>
      <Text style={styles.title}>{t.historyTitle}</Text>

      {entries.length === 0 && <Text style={styles.emptyText}>{t.historyEmpty}</Text>}

      {entries.map((entry) => {
        const entryStrings = STRINGS[entry.lang];
        const expanded = expandedId === entry.id;
        return (
          <View key={entry.id} style={styles.card}>
            <TouchableOpacity onPress={() => setExpandedId(expanded ? null : entry.id)}>
              <Text style={styles.cardDate}>
                {t.historyScannedOn} {formatDate(entry.scannedAt, lang)}
              </Text>
              <Text style={styles.cardTitle}>{entry.result.medicationName}</Text>
            </TouchableOpacity>

            {expanded && (
              <View style={styles.cardBody}>
                {TIME_SLOTS.map((slot) => {
                  const meds = entry.result.items.filter((item) => item.timeSlots.includes(slot));
                  if (meds.length === 0) return null;
                  const slotKey = `timeSlot${slot[0].toUpperCase()}${slot.slice(1)}`;
                  return (
                    <Text key={slot} style={styles.scheduleLine}>
                      <Text style={styles.scheduleLabel}>{entryStrings[slotKey]}: </Text>
                      {meds.map((m) => m.name).join(' · ')}
                    </Text>
                  );
                })}
                <Text style={styles.generalNotes}>{entry.result.generalNotes}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(entry.id)}>
              <Text style={styles.deleteButtonText}>{t.historyDelete}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backLink: {
    fontSize: 14,
    color: COLORS.accent,
    marginBottom: SPACING.lg,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT.title - 6,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT.label,
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardDate: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardBody: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  scheduleLine: {
    fontSize: FONT.small + 1,
    color: COLORS.text,
  },
  scheduleLabel: {
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  generalNotes: {
    fontSize: FONT.small + 1,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    lineHeight: 19,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: FONT.small,
    color: COLORS.danger,
    fontWeight: '700',
  },
});
