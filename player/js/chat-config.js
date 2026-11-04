/* Player chat data shared by Messages and the clinic pages (read by ../organizer/js/direct-chat.js).
   Pages spread it into window.DirectChatConfig, e.g. { ...PLAYER_CHAT, inline: '#chat-panel' }. */

(() => {
  const P = '/organizer/assets/img/people/';
  const JW = { from: 'them', who: 'Jenny Wilson', role: 'Organizer', ini: 'JW', photo: P + 'red.png' };
  const MON = { name: 'Monday Morning Tennis', when: 'Mondays · 9:00–10:30 AM' }, THU = { name: 'Thursday Rally', when: 'Thursdays · 6:00–7:30 PM' };
  window.PLAYER_CHAT = {
    assets: '/organizer/assets/icons/', me: 'Jessica', clinic: 'Monday Morning Tennis', membersWord: 'Players',
    seed: {
      'Monday Morning Tennis': [
        { ...JW, t: 'Please arrive 10 minutes early on Monday so we can start on time.', at: 'Yesterday, 6:10 PM' },
        { from: 'them', who: 'Liam Johnson', role: 'Player', ini: 'LJ', photo: P + 'curly.png', t: 'Will do! Which courts are we on?', at: 'Today, 8:12 AM' },
        { ...JW, t: 'Courts 2 and 3 this Monday.', at: 'Today, 8:15 AM' },
      ],
      'Thursday Rally': [{ from: 'them', who: 'Marcus Reed', role: 'Player', ini: 'MR', photo: P + 'man2.png', t: 'Anyone up for doubles after?', at: 'Mon, 7:30 PM' }],
      'Jenny Wilson': [
        { from: 'me', t: 'Hi Jenny, could I be added to the substitute list for Thursday Rally?', at: 'Today, 8:30 AM' },
        { from: 'them', t: 'Sure, I’ll add you to the sub list. You’ll get a notification when a spot opens.', at: 'Today, 8:40 AM' },
        { from: 'me', t: 'Thank you!', at: 'Today, 8:41 AM' },
      ],
      'Sarah Miller': [{ from: 'them', t: 'Great serve today, keep it up!', at: 'Yesterday, 11:05 AM' }],
      'Olivia Chen': [{ from: 'them', t: 'Want to carpool on Monday?', at: 'Sun, 4:20 PM' }],
    },
    profiles: {
      'Jenny Wilson': { level: 'Tennis · NTRP 4.0', since: 'January 2025', clinics: [{ ...MON, their: 'Organizer' }, { ...THU, their: 'Organizer' }] },
      'Sarah Miller': { level: 'Tennis · Certified coach', fee: '$50 per player, per session', since: 'February 2025', clinics: [{ ...MON, their: 'Coach' }] },
      'Liam Johnson': { level: 'Tennis · NTRP 3.5', since: 'October 2025', clinics: [{ ...MON, their: 'Player' }, { ...THU, their: 'Player' }] },
      'Robert Wilson': { level: 'Tennis · NTRP 4.0', since: 'May 2025', clinics: [{ ...MON, their: 'Player' }, { ...THU, their: 'Player' }] },
      'Maria Lopez': { level: 'Tennis · NTRP 3.5', since: 'March 2025', clinics: [{ ...MON, their: 'Substitute' }, { ...THU, their: 'Substitute' }] },
      'Olivia Chen': { level: 'Tennis · NTRP 3.5', since: 'January 2026', clinics: [{ ...MON, their: 'Player' }, { ...THU, their: 'Player' }] },
      'Marcus Reed': { level: 'Tennis · NTRP 4.5', since: 'August 2025', clinics: [{ ...THU, their: 'Player' }] },
    },
  };
})();
