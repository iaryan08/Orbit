# Implementation Plan: Lunar Sync (Period Tracker)

Integration of a premium, aesthetic period and cycle tracker within "MoonBetweenUs" designed for support, connection, and privacy.

## 1. Core Principles & Logic
- **Simple Deterministic Engine (v1)**:
  - `ovulationDay = cycleStart + (cycleLength - 14)`
  - `fertileWindow = (ovulationDay - 5) to (ovulationDay + 1)`
  - `nextPeriod = cycleStart + cycleLength`
- **Stored Predictions**: Predictions are calculated on log update and stored in the database to avoid heavy client-side recalculation.
- **REST for Data, Sockets for Hints**: Use standard REST API for updating health data. Use WebSockets only for lightweight "hints" or status update notifications.

## 2. Roles & Privacy (Non-Negotiable)
- **Data Ownership**: 
  - **Female Partner**: Full owner/editor. Controls all inputs.
  - **Male Partner**: Read-only viewer. Only sees what is explicitly shared.
- **Granular Permissions**:
  - `Full`: Shows phases, fertile window, and period days.
  - `Summary`: Shows only "Partner Hints" (e.g., "Low energy today") without specific dates/jargon.
  - `Hidden`: No data shared.
- **Explicit Consent**: A mandatory onboarding/toggle for the female partner before any data is visible to the partner.

## 3. Database Schema
- **`cycle_profiles` table**:
  - `user_id` (uuid, PK)
  - `last_period_start` (date)
  - `avg_cycle_length` (int, default 28)
  - `avg_period_length` (int, default 5)
  - `privacy_level` (enum: 'full', 'summary', 'hidden')
  - `sharing_enabled` (boolean, default false)
- **`cycle_logs` table**:
  - `id` (uuid, PK)
  - `user_id` (uuid)
  - `date` (date)
  - `log_type` (enum: 'period_start', 'period_end', 'symptoms')
  - `symptoms` (jsonb)
- **`cycle_predictions` table**:
  - `user_id` (uuid, PK)
  - `next_period_date` (date)
  - `ovulation_date` (date)
  - `fertile_window_start` (date)
  - `fertile_window_end` (date)

## 4. The "Translated" Feed Logic
The differentiator is how data is presented differently to each partner:

| Phase | Female Feed (Empowerment) | Male Feed (Supportive Hints) |
| :--- | :--- | :--- |
| **Menstrual** (Blood) | "Focus on rest and warmth. 🍵" | "She might feel low-energy. Great time for a cozy movie night." |
| **Follicular** (Seed) | "Your energy is rising! Perfect for new projects." | "She's feeling more active. Plan an outdoor date?" |
| **Ovulatory** (Sun) | "Confidence at its peak. You're glowing! ✨" | "She's in a high-energy phase. Great time for social activities." |
| **Luteal** (Moon) | "PMS might kick in. Be gentle with yourself." | "She may feel more sensitive today. Extra patience goes a long way." |

## 5. UI Structure
- **Dashboard**: Subtle cards containing the "Daily Hint" for both partners.
- **Lunar Tab (Female)**: Detailed cycle visualization (Moon Phases), logging calendar, and symptom trends.
- **Support Tab (Male)**: Read-only summaries and "Deep Support" advice (No medical jargon, no charts).

## 6. MVP Roadmap
- [ ] **Phase 1**: Database schema and REST API for logging.
- [ ] **Phase 2**: Prediction engine and daily cron job to update phases.
- [ ] **Phase 3**: Custom feed cards for both partners (Phase Translation).
- [ ] **Phase 4**: Privacy/Consent UI and granular permission toggles.
