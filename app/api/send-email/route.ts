import { NextResponse } from 'next/server';
import emailjs from '@emailjs/nodejs';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Initialize EmailJS with environment variables
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.NEXT_PUBLIC_EMAILJS_PRIVATE_KEY;

    if (!serviceId || !templateId || !publicKey || !privateKey) {
      console.error('Missing EmailJS configuration:', {
        serviceId: !!serviceId,
        templateId: !!templateId,
        publicKey: !!publicKey,
        privateKey: !!privateKey
      });
      return NextResponse.json(
        { error: 'Email configuration is missing' },
        { status: 500 }
      );
    }

    // Initialize EmailJS with both public and private keys
    emailjs.init({
      publicKey,
      privateKey
    });

    // Send the email
    const response = await emailjs.send(
      serviceId,
      templateId,
      { phone }
    );

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 