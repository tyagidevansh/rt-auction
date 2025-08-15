import express from 'express'
import { sendTestEmail } from '../lib/email'

const router = express.Router()

// Send test email
router.post('/test', async (req, res) => {
  try {
    const { email, name } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Use provided name or extract from email
    const userName = name || email.split('@')[0]
    const success = await sendTestEmail(email, userName)

    if (success) {
      res.json({ 
        message: 'Test email sent successfully!',
        emailSent: true,
        recipient: email
      })
    } else {
      res.status(500).json({ 
        error: 'Failed to send test email',
        emailSent: false
      })
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    res.status(500).json({ 
      error: 'Failed to send test email',
      emailSent: false
    })
  }
})

export default router
