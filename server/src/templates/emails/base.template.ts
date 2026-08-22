export interface EmailTemplateContent {
  title: string;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
}

export const baseEmailTemplate = (content: EmailTemplateContent): string => {
  const { title, body, buttonText, buttonUrl } = content;

  const buttonHtml =
    buttonText && buttonUrl
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px auto 0;">
          <tr>
              <td align="center" style="border-radius: 6px; background-color: #0095da;">
              <a
                href="${buttonUrl}"
                target="_blank"
                style="
                  display: inline-block;
                  padding: 14px 32px;
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 15px;
                  font-weight: bold;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 6px;
                "
              >
                ${buttonText}
              </a>
            </td>
          </tr>
        </table>
      `
      : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f8;">
        <table
          role="presentation"
          cellpadding="0"
          cellspacing="0"
          width="100%"
          style="background-color: #f4f6f8; padding: 40px 0;"
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                cellpadding="0"
                cellspacing="0"
                width="480"
                style="
                  background-color: #ffffff;
                  overflow: hidden;
                  font-family: Arial, Helvetica, sans-serif;
                "
              >
                <!-- Header -->
                <tr>
                  <td
                    align="center"
                    style="background-color: #0095da; padding: 24px 0;"
                  >
                    <span
                      style="
                        color: #ffffff;
                        font-size: 20px;
                        font-weight: bold;
                        letter-spacing: 0.5px;
                      "
                    >
                      Clip Note
                    </span>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <h1
                      style="
                        margin: 0 0 16px;
                        font-size: 20px;
                        color: #1a1a1a;
                        font-weight: bold;
                      "
                    >
                      ${title}
                    </h1>
                    <p
                      style="
                        margin: 0;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #4a4a4a;
                      "
                    >
                      ${body}
                    </p>
                    ${buttonHtml}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td
                    align="center"
                    style="
                      padding: 24px 32px;
                      background-color: #f4f6f8;
                      border-top: 1px solid #e8e8e8;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 12px;
                        color: #9a9a9a;
                        font-family: Arial, Helvetica, sans-serif;
                      "
                    >
                      This is an automated message from Clip Note. Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};
