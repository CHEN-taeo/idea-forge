# 🎲 Idea Forge v3.3

<p align="center">
  <img src="https://img.shields.io/github/last-commit/CHEN-taeo/idea-forge" alt="Last Commit">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>


A collaborative brainstorming game built with React, TypeScript, and Tailwind CSS.

## Features Implemented

Based on the game design critique document, this implementation includes:

### ✅ Core Game Mechanics

1. **Round 1 - Ideation**
   - Submit ideas based on assigned roles (8 roles: Visionary, Pragmatist, Contrarian, Connector, Analyst, Storyteller, Builder, Wildcard)
   - Mandatory inspiration card selection (addresses Critique #5)
   - Vote on ideas and guess authors
   - Scoring: +1 for submission, +1 for votes, +2 for correct guesses

2. **Round 2 - Adaptation**
   - Adapt and remix the best ideas from Round 1
   - **Fixed R2 incentive system** (Critique #4):
     - Original creator: +2 when their idea is adapted
     - Adapter: +1 for the adaptation
     - Both get +2 when the original creator endorses it
   - Endorsement system with visual badges

3. **Round 3 - Challenge**
   - Challenge ideas with critical flaws
   - Defense mechanism with two options: refute or accept & improve
   - **Defense voting system** (Critique #3):
     - Non-involved players vote thumbs up/down
     - Majority determines if defense was successful
     - Successful defense: +2 points
     - Successful challenge: +3 points

### ✅ Scoring & Balance

- **MVP Bonus adjusted** from +5 to +3 (Critique #2)
- **Catch-up mechanic**: Lowest-scoring player after R2 gets extra gold card (Critique #8)
- Complete scoring breakdown visible throughout the game

### ✅ Session Management

- **One-click session export** (Critique #7)
  - Exports detailed markdown report
  - Includes final standings, surviving proposals, MVP candidate
  - Session statistics and idea details
- Shared real-time idea board (addresses Critique #1)
- Room code system for multiplayer sessions

### ✅ UI/UX Features

- Clean, modern interface with gradient backgrounds
- Role-based color coding
- Inspiration card selection interface
- Challenge/defense modal dialogs
- Vote buttons with visual feedback
- Confetti celebration for winner
- Responsive design for desktop and mobile

## Game Flow

1. **Lobby**: Create or join a game, set problem statement, wait for players
2. **Round 1 Submit**: Each player submits an idea with inspiration card
3. **Round 1 Guess**: Vote on ideas and guess authors
4. **Round 2**: Adapt the best ideas, endorse adaptations
5. **Round 3**: Challenge ideas, defend them, vote on defenses
6. **Finish**: View final standings, MVP idea, export session report

## Technology Stack

- **React 18.3** with TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** components (Radix UI)
- **Socket.IO** (mock implementation for demo)
- **Canvas Confetti** for celebrations
- **Sonner** for toast notifications

## Notes

This is a frontend-only implementation with mock game state management. For production use with real multiplayer:

1. Connect to a Socket.IO server (backend implementation available in the critique document)
2. Replace the mock `useGameSocket` hook with real socket connections
3. Add authentication and room persistence
4. Implement timer synchronization
5. Add gold card mechanics
6. Implement 3-person variant rules

## Game Design Credits

Based on the Idea Forge v3.3 design critique and improvements documented in the provided game logic updates.


---

## License

MIT