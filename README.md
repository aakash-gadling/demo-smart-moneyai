## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm 9+

### 1. Start Databases

```bash
cd backend
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- MongoDB on port 27017

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
# Edit .env and add your POSTGRES (#DATABASE_URL=postgresql://smartmoney:smartmoney123@localhost:5432/smartmoney) and MONGODB_ variables
# Edit .env and add your JWT_SECRET
# Edit .env and add your JWT_EXPIRES_IN
# PORT=3001
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. Start All Services

```bash
npm run dev
```