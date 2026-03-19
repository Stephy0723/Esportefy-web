import nodemailer from 'nodemailer';

const createMailer = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

export const sendRoleApplicationMail = async (user, role, documentFile, formData) => {
  const adminEmail = process.env.EMAIL_USER;
  if (!adminEmail || !process.env.EMAIL_PASS) {
    console.warn('SMTP no configurado, omitiendo envío de correo de aplicación');
    return;
  }

  const transporter = createMailer();
  const subject = `Nueva solicitud de Rol: ${role.toUpperCase()} - ${user.username}`;
  
  let htmlContent = `
  <div style="font-family:Arial,sans-serif;background:#0f1115;padding:24px;color:#e7eaf0;">
    <h2 style="margin:0 0 12px;color:#7CFF6B;">GlitchGang · Nueva Solicitud de Rol</h2>
    <p style="margin:0 0 8px;">Un usuario ha solicitado el rol de <strong>${role.toUpperCase()}</strong>.</p>
    <ul style="line-height:1.7;">
      <li><strong>Usuario:</strong> ${user.username || '-'} (${user.email || '-'})</li>
      <li><strong>ID:</strong> ${user.userCode || user._id || '-'}</li>
    </ul>
    <h3 style="margin-top:20px;color:#7CFF6B;">Datos de la Solicitud:</h3>
    <ul style="line-height:1.7;">
  `;

  for (const [key, value] of Object.entries(formData)) {
    if (value && typeof value === 'string') {
      htmlContent += `<li><strong>${key}:</strong> ${value}</li>`;
    }
  }

  htmlContent += `
    </ul>
    <p style="margin-top:20px;font-size:12px;color:#9aa4b2;">
      Revisa y procesa la solicitud desde el panel de administración. ${documentFile ? '<strong>Documento de identidad adjunto.</strong>' : ''}
    </p>
  </div>
  `;

  const mailOptions = {
    from: `"GlitchGang Roles" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject,
    html: htmlContent,
  };

  if (documentFile) {
    mailOptions.attachments = [
      {
        filename: documentFile.originalname,
        content: documentFile.buffer,
        contentType: documentFile.mimetype
      }
    ];
  }

  await transporter.sendMail(mailOptions);
};
