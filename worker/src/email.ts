// Sends the password-reset email. NOT WIRED TO A REAL PROVIDER YET.
//
// rxhelper.jp's DNS lives at お名前.com (nameservers 0X.dnsv.jp), not on Cloudflare, so
// Cloudflare Email Service's `send_email` binding can't onboard this domain as-is (it needs
// to write SPF/DKIM records into a Cloudflare-managed zone). Two ways to unblock this:
//   (a) move rxhelper.jp's DNS to Cloudflare (bigger change, re-touches the GitHub Pages
//       A-records that were already migrated once), or
//   (b) use a third-party transactional email API (e.g. Resend) and add a couple of
//       SPF/DKIM records at お名前.com -- no nameserver migration needed.
// Until that's decided, this just logs the reset link (visible via `wrangler tail`) so the
// reset flow is fully testable end-to-end without a live provider. Swap the body of this
// function for a real send once the provider is chosen -- nothing else needs to change.
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  console.log('password_reset_email_stub', { email, resetUrl });
}
