import { Request, Response, Router } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

// GET /api/notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      })
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return res.status(500).json({
        error: 'Failed to fetch notifications'
      })
    }

    res.json({ notifications: data })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

// PATCH /api/notifications
router.patch('/', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        error: 'Notification IDs are required'
      })
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', ids)

    if (error) {
      console.error('Error marking notifications as read:', error)
      return res.status(500).json({
        error: 'Failed to mark notifications as read'
      })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

export default router
