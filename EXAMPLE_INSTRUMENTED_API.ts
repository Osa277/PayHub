/**
 * Example: Instrumented Payment API Route
 * Copy this pattern to other critical routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logApiRequest } from '@/lib/api-logger';
import { logger, dataTracker } from '@/lib/logger';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(request: NextRequest) {
  // ✅ STEP 1: Initialize API logging
  const apiLog = await logApiRequest(request, 'POST /api/payments');

  try {
    // ✅ STEP 2: Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      apiLog.logResponse(401, null, new Error('Unauthorized'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ STEP 3: Parse & validate request
    const body = await request.json();
    const { amount, currency, description, recipientEmail } = body;

    logger.debug('Payment request parsed', {
      userId: session.user.id,
      context: { amount, currency, recipientEmail },
    });

    // ✅ STEP 4: Business logic with logging
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { wallet: true },
    });

    if (!user?.wallet) {
      logger.warn('User wallet not found', {
        userId: session.user.id,
      });
      apiLog.logResponse(400, null, new Error('Wallet not found'));
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 400 }
      );
    }

    // Track transaction initiation
    dataTracker.trackTransaction('payment', session.user.id, {
      amount,
      currency,
      status: 'initiated',
    });

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: {
        userId: user.id,
        description,
      },
    });

    logger.info('Stripe payment intent created', {
      userId: session.user.id,
      context: {
        paymentIntentId: paymentIntent.id,
        amount,
      },
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount,
        currency,
        status: 'pending',
        type: 'payment',
        description,
        stripeIntentId: paymentIntent.id,
      },
    });

    logger.info('Transaction record created', {
      userId: session.user.id,
      context: {
        transactionId: transaction.id,
        status: transaction.status,
      },
    });

    // ✅ STEP 5: Log successful response
    const response = {
      success: true,
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
      amount,
      currency,
    };

    apiLog.logResponse(201, response);

    // Track transaction completion
    dataTracker.trackTransaction('payment', session.user.id, {
      amount,
      currency,
      status: 'completed',
      transactionId: transaction.id,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    // ✅ STEP 6: Error handling with logging
    logger.error('Payment creation failed', {
      userId: session?.user?.id,
      context: {
        endpoint: 'POST /api/payments',
        errorType: error.type,
      },
      error,
    });

    apiLog.logResponse(500, null, error);

    if (session?.user?.id) {
      dataTracker.trackTransaction('payment', session.user.id, {
        amount: body?.amount,
        currency: body?.currency || 'USD',
        status: 'failed',
        error: error.message,
      });
    }

    return NextResponse.json(
      { error: error.message || 'Payment creation failed' },
      { status: 500 }
    );
  }
}
