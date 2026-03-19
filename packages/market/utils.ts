/**
 * Indian market hours: 9:15 AM to 3:30 PM IST
 * Market is closed on weekends and public holidays
 */

export function isMarketOpen(): boolean {
    const now = new Date();
    
    // Convert to IST (UTC+5:30)
    const istTime = new Date(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    
    const dayOfWeek = istTime.getDay();
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    
    // Check if it's a weekend (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
    }
    
    // Convert time to minutes for easier comparison
    const currentTimeInMinutes = hours * 60 + minutes;
    const marketOpenTime = 9 * 60 + 15;      // 9:15 AM
    const marketCloseTime = 15 * 60 + 30;    // 3:30 PM
    
    return currentTimeInMinutes >= marketOpenTime && currentTimeInMinutes <= marketCloseTime;
}

export function getTimeUntilMarketOpen(): number {
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    
    const dayOfWeek = istTime.getDay();
    let targetDate = new Date(istTime);
    
    // If it's after market hours or on weekend, move to next market day
    if (dayOfWeek === 5) {
        // Friday after hours -> Monday
        targetDate.setDate(targetDate.getDate() + 3);
    } else if (dayOfWeek === 6) {
        // Saturday -> Monday
        targetDate.setDate(targetDate.getDate() + 2);
    } else if (dayOfWeek === 0) {
        // Sunday -> Monday
        targetDate.setDate(targetDate.getDate() + 1);
    } else {
        // Weekday after hours -> next day
        if (istTime.getHours() * 60 + istTime.getMinutes() > 15 * 60 + 30) {
            targetDate.setDate(targetDate.getDate() + 1);
        }
    }
    
    targetDate.setHours(9, 15, 0, 0);
    
    const diffMs = targetDate.getTime() - now.getTime();
    return Math.max(0, diffMs);
}
