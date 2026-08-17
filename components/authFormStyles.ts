import { StyleSheet } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';

export const authFormStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT.body,
    color: COLORS.text,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FONT.button,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT.small,
    marginBottom: SPACING.sm,
    lineHeight: 19,
  },
  successText: {
    color: COLORS.primaryDark,
    fontSize: FONT.body,
    lineHeight: 24,
  },
  linkRow: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  link: {
    color: COLORS.accent,
    fontSize: FONT.small,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.xs,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: FONT.small,
  },
  footerLink: {
    color: COLORS.accent,
    fontSize: FONT.small,
    fontWeight: '700',
  },
});
