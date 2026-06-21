import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendDeactivationEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: `"Hammer Subastas" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Tu cuenta en Hammer Subastas ha sido desactivada',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Hola, ${name}.</h2>
        <p>Te informamos que tu cuenta en <strong>Hammer Subastas</strong> ha sido desactivada.</p>
        <p>Si considerás que esto es un error o querés conocer los motivos, por favor comunicarte con nuestro equipo de soporte respondiendo este correo o escribiéndonos a <a href="mailto:subastas.hammer@gmail.com">subastas.hammer@gmail.com</a>.</p>
        <p>Gracias por haber confiado en nosotros.</p>
        <p style="color: #888; font-size: 13px;">— El equipo de Hammer Subastas</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`\n📬 [MAIL DESACTIVACIÓN ENVIADO] a ${email}\n`);
};

export const sendRejectionEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: `"Hammer Subastas" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Actualización sobre tu solicitud de registro en Hammer Subastas',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Hola, ${name}.</h2>
        <p>Lamentamos informarte que tu solicitud de registro en <strong>Hammer Subastas</strong> no ha podido ser aprobada en esta instancia.</p>
        <p>Si querés conocer los motivos o tenés alguna consulta al respecto, por favor comunicarte con nuestro equipo de soporte respondiendo este correo o escribiéndonos a <a href="mailto:subastas.hammer@gmail.com">subastas.hammer@gmail.com</a>.</p>
        <p>Gracias por tu interés.</p>
        <p style="color: #888; font-size: 13px;">— El equipo de Hammer Subastas</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`\n📬 [MAIL RECHAZO ENVIADO] a ${email}\n`);
};

export const sendTemporaryPasswordEmail = async (email: string, tempCode: string, name: string) => {
  const mailOptions = {
    from: `"Hammer Subastas" <${process.env.MAIL_USER}>`,
    to: email,
    subject: '¡Tu registro de postor ha sido aprobado!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>¡Hola, ${name}!</h2>
        <p>Tu investigación de antecedentes fue exitosa y has sido admitido.</p>
        <p>Contraseña Temporal: <strong style="font-size: 18px; color: #007bff;">${tempCode}</strong></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`\n📬 [MAIL ENVIADO] a ${email}\n`);
};
