/**
 * DailyFresh Cutoff Guard Middleware
 * 
 * Prevents 'today_evening' orders from being placed after 11:30 AM IST.
 */

const CUTOFF_HOUR = 11;
const CUTOFF_MINUTE = 30;

export const cutoffGuard = (req, res, next) => {
  const { delivery_type } = req.body;

  // Only validate today_evening delivery type
  if (delivery_type !== 'today_evening') {
    return next();
  }

  const now = new Date();
  
  // Convert current time to IST for comparison (if server is not in IST)
  // Since the requirement is 11:30 AM IST daily.
  const nowIST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const cutoffIST = new Date(nowIST);
  cutoffIST.setHours(CUTOFF_HOUR, CUTOFF_MINUTE, 0, 0);

  if (nowIST > cutoffIST) {
    return res.status(423).json({
      success: false,
      error: 'CUTOFF_PASSED',
      message: 'Today evening slot is closed. Please choose another delivery type.',
    });
  }

  next();
};
