/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to JEE — confirm your email to get started</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>JEE</Text>
          <Text style={tagline}>Just Enough Emotions</Text>
        </Section>
        <Heading style={h1}>Welcome aboard 🌱</Heading>
        <Text style={text}>
          You're one step away from understanding your attachment style and building healthier relationships.
        </Text>
        <Text style={text}>
          Confirm your email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm My Email
        </Button>
        <Text style={footer}>
          If you didn't sign up for JEE, feel free to ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: '#4d8b6e', textDecoration: 'underline' }
const button = {
  backgroundColor: '#4d8b6e',
  color: '#f7f5f0',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
