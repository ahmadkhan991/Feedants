<<<<<<< HEAD
# Feedants — Competition Details Screen

This project is a full-stack implementation of the **Competition Details screen** based on the provided design.

The frontend is built with **React Native (Expo)**, while the backend uses **Node.js, Express, and MongoDB**.

The main goal was to make the screen work with real backend data instead of hardcoded values. Things like available spots, registration status, countdowns, dates, rewards, and winners are all coming from the database and are calculated based on the current state of the competition.

## Project Structure

```text
backend/    Node.js + Express + MongoDB API
mobile/     React Native (Expo) Competition Details screen
```

## Running the Project

### Backend

```bash
cd backend

cp .env.example .env
# Add your MongoDB URI, JWT secret, and Razorpay keys

npm install

npm run seed
# Creates the "Feedants Classical Dance" demo competition

npm run dev
# Runs the API on http://localhost:4000
```

MongoDB needs to run as a **replica set** because the registration flow uses MongoDB transactions.

For local development, you can start MongoDB with:

```bash
mongod --replSet rs0
```

Then open `mongosh` and run:

```javascript
rs.initiate()
```

If you're using MongoDB Atlas, this is already handled for you.

### Quick API Test

You can test the main flow manually by first creating a user:

```bash
curl -X POST localhost:4000/api/auth/signup \
-H "Content-Type: application/json" \
-d '{"name":"Ahmad","email":"ahmad@example.com","password":"password123"}'
```

Copy the token returned by the API and use it for the registration request.

```bash
curl localhost:4000/api/competitions/feedants-classical-dance
```

Then:

```bash
curl -X POST localhost:4000/api/competitions/<id>/register \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{}'
```

## Mobile App

```bash
cd mobile

npm install

npx expo start
```

The mobile app uses the `EXPO_PUBLIC_API_URL` environment variable for the backend URL.

For a physical device or simulator, use your computer's **LAN IP address instead of `localhost`**. For example:

```text
EXPO_PUBLIC_API_URL=http://192.168.x.x:4000
```

`localhost` would point back to the device itself rather than your development machine.

### Razorpay

The Razorpay checkout integration has been left as a clearly marked integration point inside `handleRegister`.

The server-side Razorpay flow is already implemented, including:

* Order creation
* Webhook verification
* Payment hold expiry

The actual mobile checkout requires Razorpay test credentials and the native SDK, so that part has not been connected in this environment.

## How the Backend Works

The main entities in the application are:

### Competition

A competition stores information such as:

* Tags
* Prize pool
* Entry fee
* Total number of spots
* Remaining spots
* Judge information
* Competition lifecycle dates
* Rewards
* Previous winners
* Results for the current edition

The `results` array starts empty and can be populated when the results are officially published.

### Registration

A registration connects a user with a competition.

It follows this basic flow:

```text
pending_payment → confirmed
                 ↘ expired
                 ↘ cancelled
```

There is also a unique index on:

```text
(competition, user)
```

This prevents the same user from registering for the same competition twice at the database level.

### Submission

Each user can upload a submission for a competition.

Submissions are versioned, so uploading a new version does not immediately destroy the previous one. This can be useful if there is ever a dispute or if we need to check an earlier submission.

## Competition State

The competition state logic is kept in:

```text
utils/competitionState.js
```

This is intentionally kept as a single source of truth.

Given the competition, registration, submission, and current time, it determines things such as:

* Current competition stage
* Whether the user can register
* Whether the user can submit
* What the main action button should display
* What the countdown should target

The API response, countdown, and UI button all use this same logic.

This helps prevent a situation where the frontend shows one state while the backend thinks the competition is in another state.

## Handling Concurrent Registrations

One of the main technical challenges in this assignment was handling multiple users trying to register when only a limited number of spots are available.

For example, if there is only **one spot left** and several users try to register at almost the same time, a simple approach like:

```text
Read spots
↓
Check if spots > 0
↓
Decrease spots
```

can result in overselling because multiple requests can read the same value before any of them updates it.

To avoid this, `services/registrationService.reserveSpot` uses an atomic MongoDB update:

```javascript
findOneAndUpdate(
  { spotsRemaining: { $gt: 0 } },
  { $inc: { spotsRemaining: -1 } }
)
```

This means MongoDB performs the check and update together.

If there is only one spot left, only one concurrent request can successfully decrease the counter.

### Transaction

The spot reservation and registration creation are also wrapped inside a MongoDB transaction.

So the flow is basically:

```text
Reserve spot
    ↓
Create registration
    ↓
Everything succeeds → Commit
```

If registration creation fails — for example, because the user is already registered — the transaction is rolled back and the spot is returned automatically.

This prevents spots from being accidentally lost.

### Expired Payment Holds

When a user reserves a spot but doesn't complete payment, the spot should eventually become available again.

A cron job:

```text
jobs/releaseExpiredHolds.job.js
```

runs every minute and releases expired registrations.

The released spot is added back to `spotsRemaining` inside another transaction.

## Assumptions Made

A few decisions were made where the design didn't completely specify the backend behavior.

### Authentication

Authentication is intentionally kept simple.

Signup, login, and JWT authentication are included so the complete:

```text
Register → Pay → Submit
```

flow can be tested.

Features such as refresh tokens, email verification, and password reset were not added because they aren't required for this assignment.

### Registration Timing

The design doesn't show a separate registration opening date.

Because of that, `registrationOpensAt` is optional.

A competition can therefore already be open for registration when it becomes available.

### Submissions

The UI shows a single **Upload Submission** action, so I treated it as one submission slot per user.

If a user uploads again before the deadline, the new upload becomes the latest version, while the previous version is still kept in the database.

### Free Competitions

For competitions with a ₹0 entry fee, payment is skipped and the registration is confirmed immediately.

This is handled based on the competition's stored `entryFeePaise` value rather than hardcoding a particular competition.

### Previous Winners vs Current Results

I treated these as two separate things.

**Previous Winners** represents winners from earlier editions of the competition.

The current edition has its own `results` array, which remains empty until an admin or judge publishes the results after the `resultDate`.

The provided design only displays previous winners, but keeping the current results separately makes the backend easier to extend later.

### File Uploads

For this implementation, uploaded files are handled through the API using Multer and temporarily stored locally.

The storage logic is isolated inside:

```text
services/storageService.js
```

This makes it easier to replace local storage with something like S3 later without changing the rest of the application.

## Technical Trade-offs

### Cancelling a Registration

At the moment, cancelling a confirmed registration does not automatically reopen the spot.

The design mentions refunds, so cancellations are supported at the controller level, but whether a cancelled spot should immediately become available again is a business decision.

For example, a competition might intentionally keep the spot closed instead of reopening it late in the registration cycle.

I left this behavior flexible rather than making a business decision that wasn't specified in the design.

### MongoDB Transactions vs Redis

I chose MongoDB transactions for the reservation flow instead of Redis.

The main reason was simplicity and keeping the competition data and registration logic in the same source of truth.

For the scale assumed by this assignment — competitions with a relatively small number of spots — this approach is sufficient.

At much higher traffic levels, especially something similar to a flash sale with tens of thousands of requests per second, I would consider moving the reservation hot path to Redis using atomic operations and then synchronizing the result back to MongoDB.

### No Caching Yet

The competition details API currently reads directly from MongoDB.

```text
GET /competitions/:id
```

For a production system, this could be cached using Redis because competition details don't change very frequently.

I didn't add caching here because it would be a performance optimization rather than something required for the core functionality of the assignment.

### JavaScript Instead of TypeScript

I used JavaScript on both the backend and frontend to keep the implementation straightforward and focus more time on the business logic.

For a production application, I would prefer TypeScript across both applications.

A shared type package or an OpenAPI-generated client could also help keep the API response and frontend models synchronized.

## What I Would Improve for Production

If this were being taken from an assignment into a production application, I would make a few additional changes.

### 1. Move to TypeScript

Use TypeScript across both backend and mobile, ideally with shared API types.

This would reduce the chances of the frontend and backend expecting different data structures.

### 2. Redis for High-Traffic Reservations

For a much larger platform, Redis could handle the high-volume reservation path more efficiently.

MongoDB would remain the main persistent data store, while Redis could handle the temporary reservation state.

### 3. Direct File Uploads

Large videos shouldn't have to pass through the API server.

I would use S3 or another object-storage service with presigned URLs so the mobile app can upload directly to storage.

This would reduce memory usage and make the upload system easier to scale.

### 4. Proper Internationalization

The design includes an **ENG / हिंदी** language toggle.

This is currently not fully implemented.

For production, I would use an i18n library and store translated content using a structure such as:

```text
content
 ├── en
 └── hi
```

### 5. Idempotency

The registration API should also support idempotency keys.

This is particularly useful for mobile users because a weak or unstable connection can cause the same request to be retried.

An idempotency key would allow the backend to recognize that the request is a retry rather than a new registration attempt.

### 6. Monitoring and Logging

For production, I would add structured logs and request IDs along with metrics such as:

* Spot utilization
* Registration attempts
* Successful registrations
* Payment completion rate
* Pending → confirmed registrations
* Pending → expired registrations

These metrics could also help determine whether the current 10-minute payment hold period is appropriate.

### 7. Automated Tests

I would add unit tests around:

```text
utils/competitionState.js
```

because it contains pure business logic and is easy to test.

I would also add an integration test where multiple registration requests are sent simultaneously to a competition with:

```text
totalSpots: 1
```

The goal would be to verify that only one registration succeeds even when multiple users attempt to register at the same time.

## Final Note

The main focus of this implementation was not just reproducing the UI, but making the competition flow behave correctly with real backend data and concurrent users.

The most important part was making sure that **spots cannot be oversold**, registration state stays consistent between the backend and frontend, and payment holds can expire without permanently consuming competition spots.

For a production version, the next priorities would be TypeScript, Redis-based reservation handling, direct video uploads, proper internationalization, observability, and automated testing.
=======
# Feedants
This project is a full-stack implementation of the **Competition Details screen** based on the provided design.  The frontend is built with **React Native (Expo)**, while the backend uses **Node.js, Express, and MongoDB**. 
>>>>>>> 105a1bf62ddbf5a796fad593f6b82ce429e0df98
