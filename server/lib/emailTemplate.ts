import { EVENT_DETAILS } from "../../shared/registration.js";

/**
 * Email de invitación, de marca. Colores y tipografía calcan la paleta del
 * sitio (graphite/bone/cobalt) — ver client/src/index.css :root.
 */
export function invitationEmailHtml(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#0e1110;font-family:'Manrope',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0e1110;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#171b19;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:40px 36px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,.08);">
                <div style="font-family:'Arial Black',Arial,sans-serif;font-weight:900;letter-spacing:.02em;color:#fff;font-size:22px;text-transform:uppercase;">
                  Plaza Fitness
                </div>
                <div style="margin-top:6px;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#d92d20;">
                  Invitación confirmada
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 36px;color:#eae7df;">
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Hola ${firstName},</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
                  Tu inscripción a la <strong>${EVENT_DETAILS.name}</strong> fue aprobada.
                  Este es tu lugar confirmado — te esperamos.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:rgba(217,45,32,.08);border:1px solid rgba(217,45,32,.35);border-radius:12px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ff8d84;margin-bottom:4px;">Fecha</div>
                      <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:14px;">${EVENT_DETAILS.date} · ${EVENT_DETAILS.time}</div>
                      <div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ff8d84;margin-bottom:4px;">Lugar</div>
                      <div style="font-size:15px;font-weight:700;color:#fff;">${EVENT_DETAILS.address}</div>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:rgba(234,231,223,.65);">
                  Muéstranos este correo al llegar. ¡Nos vemos pronto!
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px 32px;border-top:1px solid rgba(255,255,255,.08);text-align:center;">
                <div style="font-size:10px;letter-spacing:.08em;color:rgba(234,231,223,.4);">
                  Plaza Fitness · ${EVENT_DETAILS.address}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Email de confirmación de compra de plan (/planes). Misma paleta y
 * estructura que `invitationEmailHtml`, adaptado al mensaje de plan.
 */
export function planConfirmationEmailHtml(
  fullName: string,
  planLabel: string,
  price: string
): string {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#0e1110;font-family:'Manrope',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0e1110;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#171b19;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:40px 36px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,.08);">
                <div style="font-family:'Arial Black',Arial,sans-serif;font-weight:900;letter-spacing:.02em;color:#fff;font-size:22px;text-transform:uppercase;">
                  Plaza Fitness
                </div>
                <div style="margin-top:6px;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#d92d20;">
                  Plan confirmado
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 36px;color:#eae7df;">
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Hola ${firstName},</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
                  Tu pago fue aprobado y tu plan <strong>${planLabel}</strong> ya está activo.
                  ¡Te esperamos en Plaza Fitness!
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:rgba(217,45,32,.08);border:1px solid rgba(217,45,32,.35);border-radius:12px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ff8d84;margin-bottom:4px;">Plan</div>
                      <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:14px;">${planLabel} · ${price}</div>
                      <div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ff8d84;margin-bottom:4px;">Dirección</div>
                      <div style="font-size:15px;font-weight:700;color:#fff;">${EVENT_DETAILS.address}</div>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:rgba(234,231,223,.65);">
                  Escríbenos por WhatsApp para coordinar tu primera clase. ¡Nos vemos pronto!
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px 32px;border-top:1px solid rgba(255,255,255,.08);text-align:center;">
                <div style="font-size:10px;letter-spacing:.08em;color:rgba(234,231,223,.4);">
                  Plaza Fitness · ${EVENT_DETAILS.address}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
