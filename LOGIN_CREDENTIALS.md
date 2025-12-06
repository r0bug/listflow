# ListFlow Login Credentials

## Default User Account

I've created a default user account for you to get started:

### User: Bob
- **Email:** `bob@alpha.com`
- **Name:** Bob
- **Role:** MEMBER
- **PIN:** `123456`

## How to Login

### Option 1: PIN Login (Quick User Switching)

1. Open http://localhost:5173
2. You should see Bob in the user list
3. Click on Bob's profile
4. Enter PIN: **123456**
5. You're in!

### Option 2: Email/Password Login

1. Go to http://localhost:5173
2. Click "Use Email/Password Instead" or similar option
3. Enter:
   - Email: `bob@alpha.com`
   - Password: `123456`

## Creating Additional Users

You can create more users directly in the database:

```sql
-- Connect to database
psql -U listflow -d listflow -h localhost
# Password: listflow123

-- Create a new user (example: Alice with PIN 111111)
INSERT INTO "User" (id, email, name, role, password, "locationId", "createdAt", "updatedAt")
VALUES (
  'user-alice-2',
  'alice@alpha.com',
  'Alice',
  'ADMIN',
  '$2b$10$hashed_pin_here',  -- Replace with bcrypt hash of desired PIN
  'loc1',
  NOW(),
  NOW()
);
```

### Generating PIN Hashes

To generate a bcrypt hash for a new PIN:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_PIN', 10, (e,h) => console.log(h));"
```

Example PINs and their hashes:
- **123456:** `$2b$10$y2pce8Igae5EG000K80xoOfjfdJ2CEx7pgdJxLrtul82mrQuqiPqC`
- **111111:** Generate using command above
- **999999:** Generate using command above

## User Roles

Available roles in ListFlow:
- **MEMBER** - Regular user (can process items, create listings)
- **ADMIN** - Administrator (can manage users, settings, etc.)
- **PLATFORM_ADMIN** - Super admin (full access to all features)

## Quick Access

**Frontend:** http://localhost:5173
**Login:** Bob / PIN 123456

## Troubleshooting

### "User not found"
The frontend shows mock users (Bob, Alice, Carol) as UI placeholders, but only "Bob" actually exists in the database. Other users will show "User not found" until you create them.

### "Invalid PIN"
Make sure you're entering **123456** exactly. The PIN pad should show 6 filled circles when complete.

### Can't see Bob in user list
The UI shows demo users even if they don't exist. Click on Bob anyway and enter the PIN. If Bob exists in the database, it will work.

## Next Steps

1. **Login as Bob** to test the system
2. **Upload some photos** via Import screen
3. **Test the workflow** - watch AI process your items
4. **Create more users** as needed for your team

---

**Note:** This is a development setup. For production:
- Use strong PINs (6+ digits, random)
- Enable proper authentication (OAuth, 2FA)
- Set up HTTPS
- Change all default credentials
