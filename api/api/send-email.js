import { Resend } from 'resend';

const resend = new Resend(process.env.re_d8pXwmZv_37fkSopoLCmVhNHDYDxDSvYE);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fullName, serviceName, date, time, phone, email, street, city, region, notes } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['ojotule192@gmail.com'],
      subject: `New Booking Request from ${fullName}`,
      html: `
        <h2>New Massage Booking Received!</h2>
        <p><strong>Client Name:</strong> ${fullName}</p>
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Date & Time:</strong> ${date} at ${time}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Address:</strong> ${street}, ${city}, ${region}</p>
        <p><strong>Special Notes:</strong> ${notes}</p>
      `
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}