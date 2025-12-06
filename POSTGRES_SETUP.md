# PostgreSQL Setup for ListFlow

## Current Credentials (from .env)

```bash
DATABASE_URL="postgresql://postgres:@localhost:5432/listflow?schema=public"
```

**Details:**
- **User:** `postgres`
- **Password:** (empty - peer authentication)
- **Database:** `listflow`
- **Host:** `localhost`
- **Port:** `5432`

## Issue

The installer likely failed because the `listflow` database doesn't exist yet, or there's an authentication issue.

## Setup Steps

### Option 1: Quick Setup (Run these commands)

```bash
# 1. Create the database
sudo -u postgres createdb listflow

# 2. Test connection
psql -U postgres -h localhost -d listflow -c "SELECT version();"

# 3. If that works, run Prisma migrations
cd /home/ynebay/listflow
npx prisma migrate dev

# 4. Start ListFlow
./start.sh
```

### Option 2: Manual Setup with Password

If you want a password-protected setup:

```bash
# 1. Connect to PostgreSQL as postgres user
sudo -u postgres psql

# 2. In PostgreSQL shell, run:
CREATE USER listflow WITH PASSWORD 'listflow123';
CREATE DATABASE listflow OWNER listflow;
GRANT ALL PRIVILEGES ON DATABASE listflow TO listflow;
\q

# 3. Update .env file
nano /home/ynebay/listflow/.env

# Change this line:
DATABASE_URL="postgresql://postgres:@localhost:5432/listflow?schema=public"

# To this:
DATABASE_URL="postgresql://listflow:listflow123@localhost:5432/listflow?schema=public"

# 4. Run Prisma migrations
cd /home/ynebay/listflow
npx prisma migrate dev

# 5. Start ListFlow
./start.sh
```

### Option 3: Use Existing User (Simplest)

```bash
# 1. Create database with your current user
createdb listflow

# 2. Update .env to use your username
nano /home/ynebay/listflow/.env

# Change:
DATABASE_URL="postgresql://postgres:@localhost:5432/listflow?schema=public"

# To (replace 'ynebay' with your username if different):
DATABASE_URL="postgresql://ynebay:@localhost:5432/listflow?schema=public"

# 3. Run Prisma migrations
cd /home/ynebay/listflow
npx prisma migrate dev

# 4. Start ListFlow
./start.sh
```

## Testing Connection

Try these commands to test:

```bash
# Test 1: Can you connect to PostgreSQL?
psql -l

# Test 2: Can you connect to listflow database?
psql -d listflow -c "SELECT version();"

# Test 3: Check if database exists
psql -l | grep listflow
```

## What Each Command Does

### `createdb listflow`
Creates a new PostgreSQL database named "listflow"

### `psql -l`
Lists all PostgreSQL databases

### `psql -d listflow`
Connects to the "listflow" database

### `npx prisma migrate dev`
Runs database migrations to create all the tables ListFlow needs

## Common Errors

### Error: "database does not exist"
**Solution:** Run `createdb listflow` or `sudo -u postgres createdb listflow`

### Error: "Peer authentication failed"
**Solution:** Use Option 2 (manual setup with password) or Option 3 (use your user)

### Error: "permission denied"
**Solution:** Make sure your user has PostgreSQL access or use `sudo -u postgres`

## Quick Diagnosis

Run this to see what's wrong:

```bash
cd /home/ynebay/listflow

# Check PostgreSQL is running
systemctl status postgresql

# Check if you can connect
psql -l

# Check if listflow database exists
psql -l | grep listflow

# If database doesn't exist, create it:
createdb listflow

# Then run migrations:
npx prisma migrate dev
```

## After Database is Set Up

Once the database is working:

```bash
cd /home/ynebay/listflow

# Install dependencies (if not done)
npm install

# Install frontend dependencies
cd client && npm install && cd ..

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start the application
./start.sh
```

## Your Current Status

Based on the .env file, the installer already:
- ✅ Created .env file
- ✅ Set up credentials
- ✅ Added eBay API keys
- ✅ Added Segmind API key
- ❌ Database might not exist yet

**Next Step:** Create the database using one of the options above, then run migrations.

## Recommended Path

**Simplest (try this first):**

```bash
cd /home/ynebay/listflow

# Create database with current user
createdb listflow

# Run migrations
npx prisma migrate dev

# Start
./start.sh
```

If that works, you're done! If not, try Option 1 or 2 above.
