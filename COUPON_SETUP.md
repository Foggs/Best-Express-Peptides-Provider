# Coupon System Setup

## Database Schema
The coupon system has been successfully set up with the following:

### Coupon Table
- `code` - Unique coupon code (e.g., "WELCOME10")
- `discountType` - "percentage" or "fixed" 
- `discountValue` - Discount amount (percentage or cents)
- `isActive` - Boolean to enable/disable coupon
- `expiresAt` - Optional expiration date
- `maxUses` - Optional usage limit
- `timesUsed` - Tracks current usage count
- `minOrderAmount` - Minimum order subtotal in cents

### Order Table Updates
- `discount` - Discount amount applied
- `couponCode` - Which coupon was used

## Sample Coupons
Three test coupons have been created:

1. **WELCOME10** - 10% off (no minimum, unlimited uses)
2. **SUMMER25** - 25% off (expires Aug 31, max 50 uses, $50 minimum)
3. **FLAT20** - $20 off fixed amount (max $100 minimum order)

## How It Works

### Frontend
1. User enters coupon code in Order Summary
2. Clicks "Apply"
3. Frontend calls `/api/coupon` with code and subtotal

### Backend (/api/coupon)
1. Validates coupon exists and is active
2. Checks expiration date
3. Verifies usage limits
4. Checks minimum order amount
5. Calculates discount (percentage or fixed)
6. Returns discount amount

### Result
- Green badge shows applied coupon
- Discount line item displays in Order Summary
- Total is recalculated automatically

## Testing the System

1. Go to checkout page
2. Add items to cart and proceed to checkout
3. In Order Summary, enter: `WELCOME10`
4. Click Apply
5. You should see 10% discount applied

## Adding New Coupons

You can add new coupons via:
- Database directly (Replit database pane)
- Admin panel (future feature)
- API endpoint (future feature)

Example SQL:
```sql
INSERT INTO "Coupon" (id, code, "discountType", "discountValue", "isActive", "minOrderAmount")
VALUES (cuid(), 'NEWCODE', 'percentage', 15, true, 0);
```
