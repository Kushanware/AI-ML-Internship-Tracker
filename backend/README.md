# Backend - AI/ML Internship Tracker

This folder contains a minimal Express-based backend scaffold for the AI/ML Internship Tracker project.

Quick start

1. cd backend
2. npm install
3. copy `.env.example` to `.env` and edit values
4. npm run dev (requires nodemon) or npm start

Seeding the database

- Ensure MongoDB is running (local or Atlas)
- Run: `npm run seed` to populate sample internships

Next steps

- Add auth endpoints, save/track endpoints, and scrapers.

Endpoints

- GET /health - health check
- GET /internships - sample list of internships (static data in scaffold)

Notes

- This scaffold uses in-memory sample data. Next steps: connect to MongoDB, add Mongoose models and seed scripts.
