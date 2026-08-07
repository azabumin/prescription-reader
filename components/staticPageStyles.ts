import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const staticPageStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  backLink: {
    fontSize: 14,
    color: COLORS.accent,
    marginBottom: SPACING.lg,
    fontWeight: '600',
  },
  langBlock: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  body: {
    fontSize: 14.5,
    color: COLORS.text,
    lineHeight: 22,
  },
  muted: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});
