const nodemailer = require('nodemailer')

// TODO: Configure via environment variables (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    })
    return info
  } catch (err) {
    console.error('Failed to send email', err)
    throw err
  }
}

module.exports = {
  sendMail
}
