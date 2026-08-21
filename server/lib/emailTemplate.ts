import { EVENT_DETAILS } from "../../shared/registration.js";
import { SITE_URL, WHATSAPP_URL, mapsSearchUrl } from "../../shared/contact.js";
import { scheduleGroups } from "../../shared/schedule.js";

const HEADER_IMAGE_URL = `${SITE_URL}/media/plaza-fitness-mail-header.png`;
const MAPS_URL = mapsSearchUrl(EVENT_DETAILS.address);

/** Filas de la tabla de horarios — misma fuente que la sección Horarios
 * del sitio (shared/schedule.ts), condensada a un rango general por
 * grupo en vez de listar cada bloque suelto. */
function scheduleRows(): string {
  return scheduleGroups
    .map(
      group => `
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:rgba(234,231,223,.85);">${group.days}</td>
                      <td style="padding:6px 0;font-size:13px;color:#fff;font-weight:700;text-align:right;">${group.slots[0].split("–")[0]}–${group.slots[group.slots.length - 1].split("–")[1]}</td>
                    </tr>`
    )
    .join("");
}

/** Dos botones de acción tipo pill — celdas con background-color/
 * border-radius inline, el patrón estándar de "botones" en HTML de
 * correo (nada de box-shadow/backdrop-filter, sin soporte confiable). */
function actionButtons(): string {
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
                <tr>
                  <td width="50%" style="padding:0 6px 0 0;">
                    <a href="${WHATSAPP_URL}" style="display:block;padding:14px 12px;border-radius:999px;background:#d92d20;color:#fff;font-size:13px;font-weight:700;text-align:center;text-decoration:none;">Escríbenos por WhatsApp</a>
                  </td>
                  <td width="50%" style="padding:0 0 0 6px;">
                    <a href="${MAPS_URL}" style="display:block;padding:14px 12px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.24);color:#fff;font-size:13px;font-weight:700;text-align:center;text-decoration:none;">Cómo llegar</a>
                  </td>
                </tr>
              </table>`;
}

function shell(kicker: string, body: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <style>
      :root {
        color-scheme: dark;
        supported-color-schemes: dark;
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#0e1110;font-family:'Manrope',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0e1110;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#171b19;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;">
            <tr>
              <td>
                <img src="${HEADER_IMAGE_URL}" width="520" height="110" alt="" style="display:block;width:100%;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,.08);">
                <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#d92d20;">
                  ${kicker}
                </div>
              </td>
            </tr>
            ${body}
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
 * Email de invitación, de marca. Colores y tipografía calcan la paleta
 * del sitio (graphite/bone/cobalt) — ver client/src/index.css :root.
 */
export function invitationEmailHtml(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;

  const body = `
            <tr>
              <td style="padding:24px 36px 8px;color:#eae7df;">
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Hola ${firstName},</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
                  Tu inscripción a la <strong>${EVENT_DETAILS.name}</strong> está confirmada.
                  Este es tu lugar — te esperamos.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:rgba(217,45,32,.08);border:1px solid rgba(217,45,32,.35);border-radius:12px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ff8d84;margin-bottom:4px;">Fecha</div>
                      <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:14px;">${EVENT_DETAILS.date} · ${EVENT_DETAILS.time}</div>
                      <div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ff8d84;margin-bottom:4px;">Lugar</div>
                      <div style="font-size:15px;font-weight:700;color:#fff;">${EVENT_DETAILS.address}</div>
                    </td>
                  </tr>
                </table>
                ${actionButtons()}
                <p style="margin:16px 0 4px;font-size:13px;line-height:1.6;color:rgba(234,231,223,.65);">
                  Muéstranos este correo al llegar. ¡Nos vemos pronto!
                </p>
              </td>
            </tr>`;

  return shell("Invitación confirmada", body);
}

/**
 * Email de confirmación de compra de plan (/planes). Misma paleta y
 * estructura que `invitationEmailHtml`, adaptado al mensaje de plan e
 * incluyendo los horarios de clases.
 */
export function planConfirmationEmailHtml(
  fullName: string,
  planLabel: string,
  price: string
): string {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;

  const body = `
            <tr>
              <td style="padding:24px 36px 8px;color:#eae7df;">
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Hola ${firstName},</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
                  Tu pago fue aprobado y tu plan <strong>${planLabel}</strong> ya está activo.
                  ¡Te esperamos en Plaza Fitness!
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:rgba(217,45,32,.08);border:1px solid rgba(217,45,32,.35);border-radius:12px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ff8d84;margin-bottom:4px;">Plan</div>
                      <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:14px;">${planLabel} · ${price}</div>
                      <div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ff8d84;margin-bottom:4px;">Dirección</div>
                      <div style="font-size:15px;font-weight:700;color:#fff;">${EVENT_DETAILS.address}</div>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:10px;">Horarios de clases</div>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${scheduleRows()}</table>
                    </td>
                  </tr>
                </table>
                ${actionButtons()}
                <p style="margin:16px 0 4px;font-size:13px;line-height:1.6;color:rgba(234,231,223,.65);">
                  Escríbenos por WhatsApp para coordinar tu primera clase. ¡Nos vemos pronto!
                </p>
              </td>
            </tr>`;

  return shell("Plan confirmado", body);
}
