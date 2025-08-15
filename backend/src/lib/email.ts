import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key from environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@rtauction.com'

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
} else {
  console.warn('SENDGRID_API_KEY not found in environment variables. Email functionality will be disabled.')
}

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    console.log('Email not sent - SendGrid not configured:', emailData.subject)
    return false
  }

  try {
    const msg = {
      to: emailData.to,
      from: FROM_EMAIL,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }

    await sgMail.send(msg)
    console.log(`Email sent successfully to ${emailData.to}: ${emailData.subject}`)
    return true
  } catch (error: any) {
    console.error('Error sending email:', {
      to: emailData.to,
      subject: emailData.subject,
      error: error.message,
      body: error.body
    })
    return false
  }
}

// Email Templates
export const createSellerSummaryEmail = (
  sellerName: string,
  auctionTitle: string,
  finalBid: number | null,
  bidderName: string | null,
  wasAccepted: boolean | null
): EmailData => {
  const subject = `Auction Complete: ${auctionTitle}`
  
  let statusMessage = ''
  let statusColor = '#6b7280' // gray
  
  if (!finalBid) {
    statusMessage = 'Your auction ended with no bids.'
    statusColor = '#6b7280'
  } else if (wasAccepted === null) {
    statusMessage = `Your auction received a final bid of $${finalBid} from ${bidderName}. You can accept or reject this bid from your auction page.`
    statusColor = '#f59e0b' // yellow
  } else if (wasAccepted) {
    statusMessage = `Congratulations! You accepted the bid of $${finalBid} from ${bidderName}.`
    statusColor = '#10b981' // green
  } else {
    statusMessage = `You rejected the final bid of $${finalBid} from ${bidderName}.`
    statusColor = '#ef4444' // red
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
           Auction Summary
        </h1>
        
        <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
          Hello ${sellerName},
        </p>
        
        <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
          Your auction "<strong>${auctionTitle}</strong>" has concluded.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${statusColor};">
          <p style="color: #1f2937; font-size: 16px; margin: 0; font-weight: 500;">
            ${statusMessage}
          </p>
        </div>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
          <h3 style="color: #1f2937; margin-bottom: 15px;">Auction Details:</h3>
          <ul style="color: #374151; line-height: 1.6;">
            <li><strong>Title:</strong> ${auctionTitle}</li>
            ${finalBid ? `<li><strong>Final Bid:</strong> $${finalBid}</li>` : ''}
            ${bidderName ? `<li><strong>Highest Bidder:</strong> ${bidderName}</li>` : ''}
            <li><strong>Status:</strong> ${wasAccepted === true ? 'Accepted' : wasAccepted === false ? 'Rejected' : finalBid ? 'Pending Decision' : 'No Bids'}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-auctions" 
             style="background-color: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View Your Auctions
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
          Thank you for using RTAuction!
        </p>
      </div>
    </div>
  `

  return {
    to: '',
    subject,
    html
  }
}

export const createBidderCongratulationsEmail = (
  bidderName: string,
  auctionTitle: string,
  winningBid: number,
  sellerName: string
): EmailData => {
  const subject = `🎉 Congratulations! Your bid was accepted for "${auctionTitle}"`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdf4;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #166534; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #bbf7d0; padding-bottom: 15px;">
           Congratulations!
        </h1>
        
        <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
          Hello ${bidderName},
        </p>
        
        <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
          Great news! Your bid has been <strong style="color: #166534;">accepted</strong>!
        </p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #166534; margin-bottom: 10px;">Winning Bid Details:</h3>
          <ul style="color: #374151; line-height: 1.8;">
            <li><strong>Auction:</strong> ${auctionTitle}</li>
            <li><strong>Your Winning Bid:</strong> <span style="color: #166534; font-weight: bold; font-size: 18px;">$${winningBid}</span></li>
            <li><strong>Seller:</strong> ${sellerName}</li>
          </ul>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-weight: 500;">
            <strong>Next Steps:</strong> The seller has accepted your bid. Please coordinate with them to complete the transaction details.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/notifications" 
             style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">
            View Notifications
          </a>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
             style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Browse More Auctions
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
          Happy bidding with RTAuction!
        </p>
      </div>
    </div>
  `

  return {
    to: '',
    subject,
    html
  }
}

export const createBidderRejectionEmail = (
  bidderName: string,
  auctionTitle: string,
  rejectedBid: number,
  sellerName: string
): EmailData => {
  const subject = `Bid Update: "${auctionTitle}"`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #991b1b; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #fecaca; padding-bottom: 15px;">
           Bid Update
        </h1>
        
        <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
          Hello ${bidderName},
        </p>
        
        <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
          Thank you for participating in the auction for "<strong>${auctionTitle}</strong>".
        </p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="color: #991b1b; margin: 0; font-weight: 500;">
            Unfortunately, the seller has decided not to accept your bid of $${rejectedBid}.
          </p>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #1e40af; margin: 0;">
            <strong>Don't give up!</strong> There are many other exciting auctions waiting for you on our platform.
          </p>
        </div>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
          <h3 style="color: #1f2937; margin-bottom: 15px;">Bid Summary:</h3>
          <ul style="color: #374151; line-height: 1.6;">
            <li><strong>Auction:</strong> ${auctionTitle}</li>
            <li><strong>Your Bid:</strong> $${rejectedBid}</li>
            <li><strong>Seller:</strong> ${sellerName}</li>
            <li><strong>Status:</strong> Not Accepted</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
             style="background-color: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Browse New Auctions
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
          Keep bidding with RTAuction!
        </p>
      </div>
    </div>
  `

  return {
    to: '',
    subject,
    html
  }
}

// Test email function
export const sendTestEmail = async (toEmail: string, userName: string): Promise<boolean> => {
  const emailData: EmailData = {
    to: toEmail,
    subject: ' RTAuction Email Test - Success!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="text-align: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 8px;">
          <h1 style="color: #333; font-size: 28px; margin: 0;">RTAuction</h1>
          <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">Real-time Auction Platform</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #28a745; margin-bottom: 20px; font-size: 24px;">🎉 Email Integration Test Successful!</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Hello <strong>${userName}</strong>,
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Congratulations! This test email confirms that our email system is working perfectly. 
            You will now receive important updates about your auctions directly to your inbox.
          </p>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 6px; border-left: 4px solid #2196f3;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">📧 What emails will you receive?</h3>
            <ul style="color: #555; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li><strong>Auction Summary:</strong> When your auction ends</li>
              <li><strong>Bid Acceptance:</strong> When your bid is accepted</li>
              <li><strong>Bid Updates:</strong> Important bid-related notifications</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px; background: white; border-radius: 8px;">
          <p style="margin: 0 0 10px 0;">Thank you for using RTAuction!</p>
          <p style="margin: 0;">
            <a href="http://localhost:3000" style="color: #007bff; text-decoration: none; font-weight: bold;">Visit RTAuction →</a>
          </p>
        </div>
      </div>
    `,
    text: `Hello ${userName}, this is a test email from RTAuction to confirm that email integration is working correctly!`
  }

  return await sendEmail(emailData)
}

// Auction ended email for highest bidder (awaiting seller decision)
export const createAuctionEndedBidderEmail = (
  bidderName: string,
  auctionTitle: string,
  winningBid: number,
  sellerName: string
): EmailData => {
  const subject = `Auction Ended: "${auctionTitle}" - You Have the Highest Bid!`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f9ff;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #1e40af; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #bfdbfe; padding-bottom: 15px;">
           Auction Has Ended!
        </h1>
        
        <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
          Hello ${bidderName},
        </p>
        
        <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
          Great news! The auction for "<strong>${auctionTitle}</strong>" has ended and <strong style="color: #1e40af;">you have the highest bid</strong>!
        </p>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin-bottom: 10px;">Your Highest Bid Details:</h3>
          <ul style="color: #374151; line-height: 1.8;">
            <li><strong>Auction:</strong> ${auctionTitle}</li>
            <li><strong>Your Highest Bid:</strong> <span style="color: #1e40af; font-weight: bold; font-size: 18px;">$${winningBid}</span></li>
            <li><strong>Seller:</strong> ${sellerName}</li>
          </ul>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-weight: 500;">
            <strong>⏳ Next Steps:</strong> The seller will now review your bid and decide whether to accept or decline it. You'll receive an email notification once they make their decision.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/notifications" 
             style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">
            View Notifications
          </a>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
             style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Browse More Auctions
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
          Thank you for participating in RTAuction!
        </p>
      </div>
    </div>
  `

  return {
    to: '',
    subject,
    html
  }
}
