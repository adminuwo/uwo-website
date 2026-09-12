const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const AffiliateClick = require('./models/AffiliateClick');
    const partnerId = '6a59e191b7527b0b754e82ef'; // Abha
    
    const clickQuery = { partnerId: new mongoose.Types.ObjectId(partnerId) };
    const notTotalQuery = { ...clickQuery, click_type: { $ne: 'total' } };
    
    const uniqueClicks = await AffiliateClick.countDocuments(notTotalQuery);
    const totalVisits = await AffiliateClick.countDocuments(clickQuery);
    const allClicks = await AffiliateClick.find(clickQuery, { click_type: 1, visitor_id: 1, created_at: 1 });
    
    console.log('Partner: Abha (UWO-ABHAA-001)');
    console.log('uniqueClicks (not total):', uniqueClicks);
    console.log('totalVisits:', totalVisits);
    console.log('All clicks:', JSON.stringify(allClicks, null, 2));
    
    // Also check what partner dashboard controller would return
    // getPartnerDashboard uses: clickDateQuery = {} (no filter), partnerId
    const AffiliateSession = require('./models/AffiliateSession');
    const sessions = await AffiliateSession.find({ partner_id: new mongoose.Types.ObjectId(partnerId) });
    console.log('Sessions count:', sessions.length);
    
    mongoose.disconnect();
}).catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
});
