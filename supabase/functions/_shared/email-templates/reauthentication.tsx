/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your JEE verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>JEE</Text>
          <Text style={tagline}>Just Enough Emotions</Text>
        </Section>
        <Heading style={h1}>Verification code</Heading>
        <Text style={text}>Use this code to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires shortly. Didn't request it? You can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#4d8b6e',
  margin: '0 0 30px',
  letterSpacing: '4px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
