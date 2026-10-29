/* ClinicSync — invitation sent by the organizer, in their own voice.
   Same email-safe build as invitation-email.js (tables + inline styles for Gmail, Outlook, Apple Mail).
   Send with From: "Jenny Wilson via ClinicSync" <invites@clinicsync.app> and Reply-To: the organizer,
   so "just reply" in the copy reaches them directly.
   Used by the prototype (screen 01) and by build-email.js to write emails/organizer-invitation.html. */

(function (root) {
  const C = {
    ink: '#111927', text2: '#4d5761', muted: '#6c737f', line: '#e5e7eb',
    card: '#f8f9fa', field: '#f3f4f6', brand: '#2e54b4', brand2: '#4e76dd',
    brandSoft: '#eaeef8', warn: '#a15c07', warnBg: '#fef7c3',
  };
  const FONT = "'Familjen Grotesk', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const subject = o => `${o.firstName}, join ${o.clinic.name} this season. Your spot is saved`;

  const defaultMessage = o => {
    const c = o.clinic;
    return [
      `Hi ${o.firstName},`,
      `I'm putting together ${c.name} at ${c.location} and I'd love to have you in the group. I've saved you a <b>${c.share}</b>, so you'll play ${c.allowed} of our ${c.total} sessions and pick the dates that suit you.`,
      `${c.coach} is coaching, and a couple of dates are already filling up. If you can, accept by ${o.expires} and choose your sessions.`,
      `See you on court!`,
    ];
  };

  function organizerInviteEmail(o) {
    const src = n => (o.asset ? o.asset(n) : o.assets + n);
    const c = o.clinic;
    const initials = c.organizer.split(' ').map(w => w[0]).join('').slice(0, 2);
    const message = (o.message || defaultMessage(o))
      .map(p => `<p style="margin:0 0 14px;font:400 16px/25px ${FONT};color:${C.ink};">${p}</p>`).join('');

    const rows = [
      ['pin', 'Location', c.location],
      ['cal', 'Schedule', c.schedule],
      ['clock', 'First session', c.firstSession],
      ['court', 'Your share', `${c.share} · ${c.allowed} of ${c.total} sessions`],
      ['user', 'Coach', c.coach],
    ];
    const row = ([ic, k, v], i) => `
                <tr>
                  <td class="row-label" style="padding:12px 12px 12px 0;${i ? `border-top:1px solid ${C.field};` : ''}font:400 15px/20px ${FONT};color:${C.muted};white-space:nowrap;" valign="middle">
                    <img src="${src(`email/${ic}.png`)}" width="18" height="18" alt="" style="display:inline-block;vertical-align:-4px;margin-right:10px;border:0;">${k}
                  </td>
                  <td align="right" style="padding:12px 0;${i ? `border-top:1px solid ${C.field};` : ''}font:500 15px/20px ${FONT};color:${C.ink};" valign="middle">${v}</td>
                </tr>`;

    const steps = [
      ['Accept the invite', 'Create your ClinicSync account in under a minute.'],
      [`Pick your ${c.allowed} sessions`, 'Choose the dates that work for you while spots are open.'],
      [`Pay your ${c.facilityFee} facility fee`, `By card, Venmo (${c.venmo}) or cash at your first session.`],
    ];
    const step = ([t, d], i) => `
                <tr>
                  <td width="44" valign="top" style="padding:${i ? '16px' : '0'} 0 0;">
                    <div style="width:30px;height:30px;border-radius:999px;background:${C.brandSoft};color:${C.brand};font:600 15px/30px ${FONT};text-align:center;">${i + 1}</div>
                  </td>
                  <td valign="top" style="padding:${i ? '16px' : '0'} 0 0;">
                    <div style="font:600 16px/22px ${FONT};color:${C.ink};">${t}</div>
                    <div style="font:400 14px/20px ${FONT};color:${C.text2};margin-top:2px;">${d}</div>
                  </td>
                </tr>`;

    const button = (href, label, primary, id) => `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                  <td align="center" bgcolor="${primary ? C.brand : C.field}" style="border-radius:999px;${primary ? `background:${C.brand};background-image:linear-gradient(90deg,${C.brand},${C.brand2});` : ''}">
                    <a href="${href}" ${id ? `data-action="${id}"` : ''} target="_blank" style="display:block;padding:17px 12px;font:500 17px/22px ${FONT};color:${primary ? '#ffffff' : C.ink};text-decoration:none;border-radius:999px;">${label}</a>
                  </td>
                </tr></table>`;

    return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<title>${subject(o)}</title>
<link href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:#ffffff; }
  a { color:${C.brand}; }
  @media (max-width: 620px) {
    .container { width:100% !important; }
    .px { padding-left:20px !important; padding-right:20px !important; }
    .stack, .stack > tbody, .stack > tbody > tr, .stack > tbody > tr > td { display:block !important; width:100% !important; }
    .stack .gap { height:12px !important; }
    .row-label { white-space:nowrap !important; padding-right:12px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${c.organizerFirst} saved you a ${c.share} in ${c.name}: ${c.allowed} of ${c.total} sessions at ${c.location}, starting ${c.firstSession}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:0;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

        <!-- Header -->
        <tr><td class="px" style="padding:24px 32px;border-bottom:1px solid ${C.field};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle"><img src="${src('logo-mark.png')}" width="32" height="29" alt="" style="display:inline-block;vertical-align:middle;border:0;"><span style="font:600 23px/29px ${FONT};color:${C.ink};vertical-align:middle;margin-left:9px;letter-spacing:-0.2px;">ClinicSync</span></td>
            <td align="right" valign="middle" style="font:400 13px/18px ${FONT};color:${C.muted};">Invitation from ${c.organizer}</td>
          </tr></table>
        </td></tr>

        <!-- Organizer -->
        <tr><td class="px" style="padding:36px 32px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle" style="padding-right:14px;">
              <div style="width:52px;height:52px;border-radius:999px;background:${C.brand};color:#ffffff;font:600 18px/52px ${FONT};text-align:center;">${initials}</div>
            </td>
            <td valign="middle">
              <div style="font:600 17px/22px ${FONT};color:${C.ink};">${c.organizer}</div>
              <div style="font:400 14px/20px ${FONT};color:${C.muted};">Organizer · ${c.name}</div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Personal message -->
        <tr><td class="px" style="padding:24px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.card};border-radius:20px;border-left:4px solid ${C.brand};">
            <tr><td style="padding:24px 24px 10px;">
              ${message}
              <p style="margin:0 0 14px;font:500 16px/22px ${FONT};color:${C.ink};">${c.organizerFirst}</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Actions -->
        <tr><td class="px" style="padding:28px 32px 0;">
          <table role="presentation" class="stack" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="38%" valign="top">${button(o.declineHref, "Can't make it", false, 'decline')}</td>
            <td class="gap" width="2%" style="font-size:0;line-height:0;">&nbsp;</td>
            <td width="60%" valign="top">${button(o.acceptHref, 'Accept &amp; choose sessions', true, 'accept')}</td>
          </tr></table>
          <p style="margin:12px 0 0;text-align:center;font:400 13px/19px ${FONT};color:${C.muted};">Your spot is held until ${o.expires}.</p>
        </td></tr>

        <!-- Clinic details -->
        <tr><td class="px" style="padding:36px 32px 0;">
          <div style="font:600 19px/26px ${FONT};color:${C.ink};margin-bottom:12px;">The clinic</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.line};border-radius:16px;">
            <tr><td style="padding:4px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.map(row).join('')}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Fees -->
        <tr><td class="px" style="padding:28px 32px 0;">
          <div style="font:600 19px/26px ${FONT};color:${C.ink};margin-bottom:12px;">What it costs</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.card};border-radius:16px;">
            <tr><td style="padding:16px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font:500 15px/20px ${FONT};color:${C.ink};">Facility fee <span style="color:${C.muted};font-weight:400;">· once, for your ${c.share}</span></td>
                  <td align="right" style="font:600 15px/20px ${FONT};color:${C.ink};">${c.facilityFee}</td>
                </tr>
                <tr>
                  <td style="padding-top:10px;font:500 15px/20px ${FONT};color:${C.ink};">Coach fee <span style="color:${C.muted};font-weight:400;">· per session you attend</span></td>
                  <td align="right" style="padding-top:10px;font:600 15px/20px ${FONT};color:${C.ink};">${c.coachFee}</td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font:400 13px/19px ${FONT};color:${C.muted};">Pay the facility fee by card, on Venmo to ${c.venmo}, or in cash at your first session. Pay now or later, whatever is easier.</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- How it works -->
        <tr><td class="px" style="padding:28px 32px 0;">
          <div style="font:600 19px/26px ${FONT};color:${C.ink};margin-bottom:16px;">How joining works</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps.map(step).join('')}
          </table>
        </td></tr>

        <!-- Reply -->
        <tr><td class="px" style="padding:28px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.brandSoft};border-radius:16px;">
            <tr>
              <td width="40" valign="top" style="padding:17px 0 17px 18px;"><img src="${src('email/chat.png')}" width="20" height="20" alt="" style="display:block;border:0;"></td>
              <td style="padding:16px 18px 16px 4px;font:400 15px/22px ${FONT};color:${C.brand};">Questions about dates or your share? Just reply to this email. It goes straight to ${c.organizerFirst}.</td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td class="px" style="padding:36px 32px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};"><tr>
            <td style="padding-top:20px;font:400 12.5px/19px ${FONT};color:${C.muted};">
              Buttons not working? Paste this link into your browser:<br>
              <a href="${o.inviteUrl}" target="_blank" style="color:${C.brand};word-break:break-all;">${o.inviteUrl}</a><br><br>
              ${c.organizer} sent this invitation to ${o.email} using ClinicSync. Not expecting it? You can ignore this email.<br>
              © 2026 ClinicSync · <a href="${o.prefsHref}" target="_blank" style="color:${C.muted};">Email preferences</a>
            </td>
          </tr></table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  root.organizerInviteEmail = organizerInviteEmail;
  root.organizerInviteSubject = subject;
  if (typeof module !== 'undefined') module.exports = { organizerInviteEmail, subject };
})(typeof window !== 'undefined' ? window : globalThis);
