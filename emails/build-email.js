// Writes the standalone emails, ready to paste into an email service:
//   emails/invitation.html            — system invitation ("You've Been Invited!")
//   emails/organizer-invitation.html  — personal invitation sent by the organizer
// Usage: node emails/build-email.js [assetBaseUrl]   (default: ../assets/ for local preview)
const fs = require('fs'), path = require('path');
const { inviteEmail } = require('./invitation-email.js');
const { organizerInviteEmail, subject } = require('./organizer-invitation-email.js');
const base = process.argv[2] || '../assets/';
const data = {
  assets: base,
  firstName: 'Jessica',
  email: 'jessica.lee@email.com',
  expires: 'November 4, 2026',
  inviteUrl: 'https://clinicsync.app/i/MMT-7H2K',
  acceptHref: 'https://clinicsync.app/i/MMT-7H2K?action=accept',
  declineHref: 'https://clinicsync.app/i/MMT-7H2K?action=decline',
  contactHref: 'https://clinicsync.app/i/MMT-7H2K/contact',
  prefsHref: 'https://clinicsync.app/settings/email',
  clinic: {
    name: 'Monday Morning Tennis', organizer: 'Jenny Wilson', organizerFirst: 'Jenny',
    location: 'Riverside Tennis Center', schedule: 'Mondays, 9:00–10:30 AM', total: 8,
    share: 'Half Share', allowed: 4, coach: 'Jane Cooper', facilityFee: '$125.00',
    coachFee: '$50 per attending player, per session',
  },
};
fs.writeFileSync(path.join(__dirname, 'invitation.html'), inviteEmail(data));
console.log('wrote emails/invitation.html');

const organizer = {
  ...data,
  clinic: { ...data.clinic, coachFee: '$50', venmo: '@jenny-wilson', firstSession: 'Mon, Nov 2' },
};
fs.writeFileSync(path.join(__dirname, 'organizer-invitation.html'), organizerInviteEmail(organizer));
console.log(`wrote emails/organizer-invitation.html  (subject: "${subject(organizer)}")`);
