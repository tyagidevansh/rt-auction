import { Request, Response, Router } from 'express'
import { authenticateUser, createUser } from '../lib/auth'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      })
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      })
    }

    res.json({ user })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, password, and name are required'
      })
    }

    const user = await createUser(email, password, name)

    if (!user) {
      return res.status(400).json({
        error: 'User could not be created. Email may already exist.'
      })
    }

    res.json({ user })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

export default router
