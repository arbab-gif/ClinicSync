/* ClinicSync — "You've Been Invited!" email.
   Table-based layout with inline styles so it renders in Gmail, Outlook and Apple Mail.
   Used by the prototype (screen 01) and by build-email.js to write emails/invitation.html. */

(function (root) {
  const C = {
    ink: '#111927', text2: '#4d5761', muted: '#6c737f', line: '#e5e7eb',
    card: '#f8f9fa', field: '#f3f4f6', brand: '#2e54b4', brand2: '#4e76dd',
    brandSoft: '#eaeef8', warn: '#a15c07', warnBg: '#fef7c3',
  };
  const FONT = "'Familjen Grotesk', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  function inviteEmail(o) {
    // Image URLs: o.asset(name) if given, else o.assets + name (e.g. "https://cdn.clinicsync.app/").
    const src = n => (o.asset ? o.asset(n) : o.assets + n);
    const c = o.clinic;
    const rows = [
      ['pin', 'Location', c.location],
      ['cal', 'Schedule', c.schedule],
      ['clock', 'Total Sessions', `${c.total} sessions`],
      ['court', 'Your Share', c.share],
      ['checkc', 'Sessions Allowed', `${c.allowed} sessions`],
      ['user', 'Coach', c.coach],
      ['court', 'Facility Fee', c.facilityFee],
      ['coach', 'Coach Fee', c.coachFee],
    ];
    const row = ([ic, k, v], i) => `
              <tr>
                <td class="row-label" style="padding:13px 12px 13px 0;${i ? `border-top:1px solid ${C.field};` : ''}font:400 15px/20px ${FONT};color:${C.muted};white-space:nowrap;" valign="middle">
                  <img src="${src(`email/${ic}.png`)}" width="18" height="18" alt="" style="display:inline-block;vertical-align:-4px;margin-right:10px;border:0;">${k}
                </td>
                <td align="right" style="padding:13px 0;${i ? `border-top:1px solid ${C.field};` : ''}font:500 15px/20px ${FONT};color:${C.ink};" valign="middle">${v}</td>
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
<title>You've been invited to ${c.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:#ffffff; }
  a { color:${C.brand}; }
  @media (max-width: 620px) {
    .container { width:100% !important; }
    .px { padding-left:20px !important; padding-right:20px !important; }
    .stack, .stack > tbody, .stack > tbody > tr, .stack > tbody > tr > td { display:block !important; width:100% !important; }
    .stack table { width:100% !important; }
    .row-label { white-space:nowrap !important; padding-right:12px !important; }
    .stack .gap { height:12px !important; }
    .hero-title { font-size:26px !important; line-height:32px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${c.organizer} invited you to ${c.name}: ${c.share}, ${c.allowed} of ${c.total} sessions at ${c.location}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:0;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

        <!-- Header -->
        <tr><td class="px" style="padding:24px 32px;border-bottom:1px solid ${C.field};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle"><img src="${src('logo-mark.png')}" width="32" height="29" alt="" style="display:inline-block;vertical-align:middle;border:0;"><span style="font:600 23px/29px ${FONT};color:${C.ink};vertical-align:middle;margin-left:9px;letter-spacing:-0.2px;">ClinicSync</span></td>
            <td align="right" valign="middle" style="font:400 13px/18px ${FONT};color:${C.muted};">Clinic invitation</td>
          </tr></table>
        </td></tr>

        <!-- Hero -->
        <tr><td class="px" align="center" style="padding:40px 32px 8px;">
          <img src="${src('court.png')}" width="230" alt="Tennis court illustration" style="display:block;width:230px;max-width:100%;height:auto;border:0;margin:0 auto 24px;">
          <h1 class="hero-title" style="margin:0;font:600 30px/36px ${FONT};color:${C.ink};">You've Been Invited!</h1>
          <p style="margin:10px 0 0;font:400 17px/25px ${FONT};color:${C.text2};">Hi ${o.firstName}, ${c.organizer} invited you to join <b style="color:${C.ink};font-weight:600;">${c.name}</b>. Review your clinic details before accepting the invitation.</p>
        </td></tr>

        <!-- Clinic card -->
        <tr><td class="px" style="padding:28px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.card};border-radius:20px;">
            <tr><td style="padding:24px 24px 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font:600 21px/28px ${FONT};color:${C.ink};">${c.name}</td>
                <td align="right" valign="top"><span style="display:inline-block;background:${C.warnBg};color:${C.warn};font:500 13px/18px ${FONT};padding:3px 11px;border-radius:999px;">Pending</span></td>
              </tr></table>
              <p style="margin:6px 0 0;font:400 14px/20px ${FONT};color:${C.text2};">Invited by <b style="color:${C.ink};font-weight:500;">${c.organizer}</b></p>
            </td></tr>
            <tr><td style="padding:14px 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:14px;">
                <tr><td style="padding:4px 18px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.map(row).join('')}
                  </table>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:16px 24px 22px;font:400 13px/18px ${FONT};color:${C.muted};">
              <img src="${src('email/lock.png')}" width="15" height="15" alt="" style="display:inline-block;vertical-align:-3px;margin-right:8px;border:0;">Your share is assigned by the organizer. Contact ${c.organizerFirst} to request a change.
            </td></tr>
          </table>
        </td></tr>

        <!-- Info note -->
        <tr><td class="px" style="padding:20px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.brandSoft};border-radius:16px;">
            <tr>
              <td width="40" valign="top" style="padding:17px 0 17px 18px;"><img src="${src('email/info.png')}" width="20" height="20" alt="" style="display:block;border:0;"></td>
              <td style="padding:16px 18px 16px 4px;font:400 15px/22px ${FONT};color:${C.brand};">Your ${c.share} includes ${c.allowed} sessions. Coach fees are separate and depend on attendance.</td>
            </tr>
          </table>
        </td></tr>

        <!-- Actions -->
        <tr><td class="px" style="padding:28px 32px 0;">
          <table role="presentation" class="stack" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="49%" valign="top">${button(o.declineHref, 'Decline Invitation', false, 'decline')}</td>
            <td class="gap" width="2%" style="font-size:0;line-height:0;">&nbsp;</td>
            <td width="49%" valign="top">${button(o.acceptHref, 'Accept Invitation', true, 'accept')}</td>
          </tr></table>
        </td></tr>
        <tr><td class="px" align="center" style="padding:22px 32px 0;">
          <a href="${o.contactHref}" data-action="contact" target="_blank" style="font:500 16px/22px ${FONT};color:${C.brand};text-decoration:none;"><img src="${src('email/chat.png')}" width="18" height="18" alt="" style="display:inline-block;vertical-align:-4px;margin-right:8px;border:0;">Contact Organizer</a>
          <p style="margin:16px 0 0;font:400 13px/19px ${FONT};color:${C.muted};">Accepting confirms your participation. You'll choose your session dates in the next steps.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td class="px" style="padding:36px 32px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};"><tr>
            <td style="padding-top:20px;font:400 12.5px/19px ${FONT};color:${C.muted};">
              This invitation expires on ${o.expires}. Buttons not working? Paste this link into your browser:<br>
              <a href="${o.inviteUrl}" target="_blank" style="color:${C.brand};word-break:break-all;">${o.inviteUrl}</a><br><br>
              You received this email because ${c.organizer} added ${o.email} to a ClinicSync clinic. Not expecting it? You can ignore this email.<br>
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

  root.inviteEmail = inviteEmail;
  if (typeof module !== 'undefined') module.exports = { inviteEmail };
})(typeof window !== 'undefined' ? window : globalThis);
