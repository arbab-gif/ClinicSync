/* Coach chat data shared by Messages and the clinic page (read by ../organizer/js/direct-chat.js).
   Pages spread it into window.DirectChatConfig, e.g. { ...COACH_CHAT, inline: '#chat-panel' }. */
(() => {
  const P = '/organizer/assets/img/people/';
  const AJ = { from: 'them', who: 'Albert John', role: 'Organizer', ini: 'AJ', photo: P + 'man1.png' };
  const JW = { from: 'them', who: 'Jenny Wilson', role: 'Organizer', ini: 'JW', photo: P + 'red.png' };
  const SAT = { name: 'Saturday Tennis', when: 'Saturdays · 9:00–10:30 AM' }, WKD = { name: 'Weekend Beginners', when: 'Sundays · 10:00–11:30 AM' }, THU = { name: 'Thursday Rally', when: 'Thursdays · 6:00–7:30 PM' };
  window.COACH_CHAT = {
    assets: '/organizer/assets/icons/', me: 'Maria', clinic: 'Saturday Tennis', membersWord: 'Players',
    seed: {
      'Saturday Tennis': [
        { ...AJ, t: 'Courts 2 and 3 again this Saturday. Maria has the ball machine.', at: 'Yesterday, 6:10 PM' },
        { from: 'them', who: 'Liam Johnson', role: 'Player', ini: 'LJ', photo: P + 'curly.png', t: 'Could we work on returns this week?', at: 'Today, 8:12 AM' },
        { from: 'me', t: 'Yes! Returns first, then volleys at the net.', at: 'Today, 8:20 AM' },
        { from: 'them', who: 'Jessica Lee', role: 'Player', ini: 'JL', photo: P + 'blonde.png', t: 'Sounds great, see you all Saturday.', at: 'Today, 8:31 AM' },
      ],
      'Weekend Beginners': [
        { ...JW, t: 'Heads-up: Sunday Nov 22 is cancelled, the courts are being resurfaced.', at: 'Mon, 5:30 PM' },
        { from: 'me', t: 'Thanks Jenny. See everyone on the 29th!', at: 'Mon, 5:42 PM' },
      ],
      'Albert John': [
        { from: 'them', t: 'Hi Maria, could Session 7 move to Sunday at 10 AM? Riverside has a junior tournament on Saturday.', at: 'Today, 9:02 AM' },
        { from: 'them', t: 'I’ve sent the request in ClinicSync so you can accept or decline it.', at: 'Today, 9:03 AM' },
      ],
      'James Carter': [
        { from: 'them', t: 'Hey Maria, any chance you could cover Thursday Rally on Nov 26? I’m at a certification that week.', at: 'Today, 7:45 AM' },
        { from: 'them', t: 'Six players, $25 each. The request is in your invitations.', at: 'Today, 7:46 AM' },
      ],
      'Jessica Lee': [{ from: 'them', t: 'Hi Maria, I sent $25 by Venmo for the Nov 7 session.', at: 'Sun, 4:20 PM' }],
      'Jenny Wilson': [{ from: 'them', t: 'Would you be up for coaching Saturday Juniors? It starts Nov 28.', at: 'Yesterday, 2:10 PM' }],
    },
    profiles: {
      'Albert John': { level: 'Tennis · NTRP 4.0', since: 'January 2025', clinics: [{ ...SAT, their: 'Organizer' }] },
      'Jenny Wilson': { level: 'Tennis · NTRP 4.0', since: 'January 2025', clinics: [{ ...WKD, their: 'Organizer' }, { ...THU, their: 'Organizer' }] },
      'James Carter': { level: 'Tennis · USPTA certified', fee: '$25 per player, per session', since: 'June 2025', clinics: [{ ...THU, their: 'Coach' }] },
      'Olivia Davis': { level: 'Tennis · PTR certified', fee: '$25 per player, per session', since: 'March 2025', clinics: [] },
      'Liam Johnson': { level: 'Tennis · NTRP 3.5', since: 'October 2025', clinics: [{ ...SAT, their: 'Player' }] },
      'Jessica Lee': { level: 'Tennis · NTRP 3.5', since: 'September 2025', clinics: [{ ...SAT, their: 'Player' }] },
      'Olivia Chen': { level: 'Tennis · NTRP 3.5', since: 'January 2026', clinics: [{ ...SAT, their: 'Player' }] },
      'Robert Wilson': { level: 'Tennis · NTRP 4.0', since: 'May 2025', clinics: [{ ...SAT, their: 'Player' }] },
      'Priya Nair': { level: 'Tennis · NTRP 3.5', since: 'July 2025', clinics: [{ ...SAT, their: 'Substitute' }] },
    },
  };
})();
