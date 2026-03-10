import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { sendLovableEmail } from 'npm:@lovable.dev/email-js'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SITE_NAME = 'justenoughemotions'
const SENDER_DOMAIN = 'notify.jatou.ca'
const FROM_DOMAIN = 'jatou.ca'

// Attachment style tips mapping
const TIPS: Record<string, { title: string; tips: string[] }> = {
  Anxious: {
    title: 'Anxious Attachment',
    tips: [
      'Practice the 20-minute pause before responding to emotional triggers.',
      'Write down your needs before conversations — clarity reduces spiraling.',
      'Notice when you\'re seeking reassurance vs. genuinely connecting.',
      'Build a self-soothing toolkit: breathing, journaling, movement.',
      'Remember: someone not responding immediately doesn\'t mean they don\'t care.',
    ],
  },
  Avoidant: {
    title: 'Avoidant Attachment',
    tips: [
      'Practice naming one emotion per day — even small ones count.',
      'When you feel the urge to withdraw, try saying "I need space" instead of disappearing.',
      'Schedule regular check-ins with your partner to build connection habits.',
      'Notice when independence becomes isolation.',
      'Vulnerability isn\'t weakness — it\'s the bridge to real intimacy.',
    ],
  },
  'Fearful-Avoidant': {
    title: 'Fearful-Avoidant Attachment',
    tips: [
      'Track your push-pull cycles — awareness is the first step to breaking them.',
      'Create a "safety plan" for when emotions overwhelm: who to call, what to do.',
      'Practice staying present during conflict instead of freezing or fleeing.',
      'Small consistent actions build trust more than grand gestures.',
      'You deserve both closeness AND safety — they\'re not mutually exclusive.',
    ],
  },
  Secure: {
    title: 'Secure Attachment',
    tips: [
      'Your secure base is a strength — use it to support others with empathy.',
      'Continue setting healthy boundaries even when things feel easy.',
      'Stay curious about your partner\'s inner world — don\'t assume you know.',
      'Model repair after conflict: own your part, express your need, reconnect.',
      'Growth never stops — keep exploring your emotional patterns.',
    ],
  },
}

function WelcomeEmail({ lean, scores }: { lean: string; scores: any }) {
  const { Body, Container, Head, Heading, Html, Preview, Section, Text, Hr } = require('npm:@react-email/components@0.0.22')
  const tipData = TIPS[lean] || TIPS['Secure']

  return React.createElement(Html, { lang: 'en', dir: 'ltr' },
    React.createElement(Head),
    React.createElement(Preview, null, `Your personalized ${tipData.title} tips from JEE`),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        React.createElement(Section, { style: logoSection },
          React.createElement(Text, { style: logoText }, 'JEE'),
          React.createElement(Text, { style: tagline }, 'Just Enough Emotions'),
        ),
        React.createElement(Heading, { style: h1 }, `Your ${tipData.title} Tips 🌱`),
        React.createElement(Text, { style: text },
          `Based on your assessment, you lean toward a ${lean} attachment style. Here are personalized tips from licensed therapists to help you build healthier relationships:`
        ),
        React.createElement(Hr, { style: { borderColor: '#e8e4dc', margin: '20px 0' } }),
        ...tipData.tips.map((tip: string, i: number) =>
          React.createElement(Text, { key: i, style: tipText },
            `${i + 1}. ${tip}`
          )
        ),
        React.createElement(Hr, { style: { borderColor: '#e8e4dc', margin: '20px 0' } }),
        scores && React.createElement(Section, null,
          React.createElement(Text, { style: { ...text, fontWeight: '600' as const, color: '#1f2f2f' } }, 'Your Scores:'),
          React.createElement(Text, { style: scoreText }, `Secure: ${scores.secure}%`),
          React.createElement(Text, { style: scoreText }, `Anxious: ${scores.anxious}%`),
          React.createElement(Text, { style: scoreText }, `Avoidant: ${scores.avoidant}%`),
          React.createElement(Text, { style: scoreText }, `Fearful-Avoidant: ${scores.fearfulAvoidant}%`),
        ),
        React.createElement(Text, { style: footer },
          'You\'re receiving this because you requested attachment style tips from JEE (Just Enough Emotions).'
        ),
      )
    )
  )
}

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  fontFamily: "'Fraunces', Georgia, serif",
  color: '#4d8b6e',
  margin: '0',
  lineHeight: '1',
}
const tagline = { fontSize: '12px', color: '#667766', margin: '4px 0 0', letterSpacing: '0.5px' }
const h1 = {
  fontSize: '22px',
  fontWeight: '600' as const,
  fontFamily: "'Fraunces', Georgia, serif",
  color: '#1f2f2f',
  margin: '0 0 16px',
}
const text = { fontSize: '14px', color: '#5a6a6a', lineHeight: '1.6', margin: '0 0 20px' }
const tipText = { fontSize: '14px', color: '#5a6a6a', lineHeight: '1.7', margin: '0 0 12px', paddingLeft: '8px' }
const scoreText = { fontSize: '13px', color: '#667766', lineHeight: '1.5', margin: '0 0 4px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, lean, scores } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const attachmentLean = lean || 'Secure'

    // Render email
    const emailElement = React.createElement(WelcomeEmail, { lean: attachmentLean, scores })
    const html = await renderAsync(emailElement)
    const plainText = await renderAsync(emailElement, { plainText: true })

    // Send via Lovable Email API
    const result = await sendLovableEmail(
      {
        to: email,
        from: `JEE <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: `Your ${attachmentLean} Attachment Style Tips 🌱`,
        html,
        text: plainText,
        purpose: 'transactional',
      },
      { apiKey }
    )

    console.log('Welcome email sent', { email, lean: attachmentLean, message_id: result.message_id })

    return new Response(JSON.stringify({ success: true, message_id: result.message_id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
