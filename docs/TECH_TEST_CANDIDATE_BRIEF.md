# Energy Usage Dashboard - Technical Assessment

## Welcome!

Thank you for taking the time to complete this technical assessment. We're excited to see how you approach solving real-world problems with React and TypeScript.

This assessment is designed to evaluate your ability to build performant, well-architected applications under time constraints. We're looking for evidence of good decision-making, clean code, and thoughtful problem-solving.

---

## 📋 The Scenario

You're building a **real-time energy monitoring dashboard** for Ford's manufacturing facilities. Plant managers need to monitor electricity consumption across different production zones, identify inefficiencies, and respond to anomalies before they become costly problems.

A manufacturing plant has multiple zones (Assembly, Paint Shop, Stamping, etc.), each with sensors reporting energy usage every 5 seconds. Your dashboard will help facility managers make data-driven decisions about energy optimization.

---

## 🎯 Your Mission

Build an MVP dashboard that allows users to:

1. **Monitor real-time energy consumption** across all manufacturing zones
2. **Visualize consumption patterns** with appropriate charts
3. **Detect anomalies** automatically using an algorithm you design
4. **Compare current usage** against historical baselines
5. **Make data insights accessible** through a clean, intuitive interface

**Time Budget: 4 hours maximum**

We're not looking for a production-ready system. We want to see:

- How you prioritize features
- How you handle technical challenges
- How you write maintainable code
- How you communicate your decisions

---

## 📦 What We Provide

You'll receive a package containing:

### 1. Mock WebSocket Server

- Simulates real sensor data from 5 manufacturing zones
- Broadcasts readings every 100ms
- Includes realistic patterns and occasional anomalies
- Easy to run: `node mock-server.ts` or `python mock-server.py`

### 2. Historical Data

- 7 days of past sensor readings (`historical-data.json`)
- ~120,000 data points across 5 zones
- Includes both normal patterns and anomalies
- Use this for baseline comparisons and testing

### 3. Zone Configuration

- Metadata about each zone (`zones-config.json`)
- Expected ranges, operating hours, equipment details
- Use this to understand "normal" behavior per zone

### 4. Setup Instructions

- Everything you need to get started
- How to connect to the data stream
- File structure overview

**Data Format:**

```json
{
  "timestamp": "2024-01-15T10:30:45Z",
  "zoneId": "assembly-1",
  "zoneName": "Assembly Line 1",
  "energyKw": 245.6,
  "temperature": 22.4,
  "equipmentCount": 12
}
```

---

## ✅ Core Requirements

### Must Have (Prioritize These!)

#### 1. Real-Time Monitoring

- Display live energy consumption for all zones
- Update smoothly without full page refresh
- Handle data arriving every 100ms efficiently
- Show which zones are currently active

#### 2. Data Visualization

- At least one time-series chart showing consumption over time
- Handle displaying 1000+ data points without lag
- Choose appropriate chart types for the data
- Consider how to show multiple zones clearly

#### 3. Anomaly Detection

- **Implement an algorithm** to flag unusual consumption patterns
- You decide what "unusual" means (statistical? threshold-based? pattern recognition?)
- Provide visual indication when anomalies are detected
- Document your approach in the README

#### 4. Historical Comparison

- Compare current usage to historical baseline
- Show percentage difference from typical usage
- Time-range selection (e.g., last hour, today, this week)
- Help users understand if current consumption is normal

### Nice to Have (If Time Permits)

- Alert notifications for critical anomalies
- Export data or reports
- Filter/search zones
- Aggregate plant-wide statistics
- Dark mode (managers use this in control rooms!)
- Predictive insights
- Mobile responsive design

**Remember:** Quality over quantity. It's better to implement 3 features well than 6 features poorly.

---

## 🔧 Technical Requirements

### Frontend

- **React** with **TypeScript** (required)
- **State Management**: Choose what makes sense (Context, Redux, Zustand, Jotai, etc.)
  - Document why you chose it
- **Visualization Library**: Your choice (Recharts, Victory, D3, Chart.js, Visx, etc.)
  - Consider performance with real-time updates

### Backend

- **Node.js** or **Python** (your choice)
- Use the provided mock server or extend it
- Create any additional APIs you need
- REST or GraphQL - whatever makes sense for your solution

### Performance Considerations ⚠️

This is crucial - we want to see how you handle:

- **Rendering large datasets** without blocking the UI
- **Memory management** for continuous data streams
- **Efficient re-renders** (React performance optimization)
- **Scalability** - how would your solution handle 50+ zones?

### Code Quality

- **TypeScript types** - no `any` unless absolutely necessary
- **Component composition** and reusability
- **Error handling** - what if the WebSocket disconnects?
- **Loading states** and edge cases
- **Clean, readable code** that others can understand

### Testing

We understand testing takes time. Given the 4-hour constraint:

- Show us your **testing strategy** even if not fully implemented
- Pick your battles - what's most important to test?
- Document your approach in the README

---

## 📁 Deliverables

### 1. Working Application

```
energy-dashboard/
├── frontend/              # React application
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/               # Mock server + any APIs
│   ├── mock-server.js
│   └── ...
├── data/                  # Historical data files
│   ├── historical-data.json
│   └── zones-config.json
├── README.md              # Your documentation (see below)
└── .gitignore
```

### 2. README.md (Critical!)

Your README should include:

```markdown
# Energy Usage Dashboard

## Quick Start

<!-- Clear instructions to build, test, and run -->

npm install
npm run dev

## Architectural Decisions

### Anomaly Detection Algorithm

<!-- Explain your approach - why did you choose it? -->
<!-- What makes a reading "anomalous" in your system? -->

### Performance Optimizations

<!-- What specific things did you do to handle real-time data efficiently? -->

### State Management

<!-- Why did you choose X over Y? -->

### Visualization Approach

<!-- Why did you pick this charting library? -->
<!-- How did you optimize chart rendering? -->

## Trade-offs & Compromises

### What I Prioritized

<!-- What did you focus on and why? -->

### What I'd Do With More Time

<!-- Next 3 priorities if you had another week -->

### Known Limitations

<!-- Be honest - what doesn't work perfectly? -->
<!-- What edge cases didn't you handle? -->

## Scaling Considerations

If this needed to support:

- 100 zones instead of 5
- 1M data points per day
- 50 concurrent users

What would you change?

## Testing Strategy

<!-- Even if you didn't write many tests, explain your approach -->

## One Thing I'm Proud Of

<!-- Show us something clever or thoughtful you did -->
```

### 3. Git Commits

- Commit **frequently** (every 30-45 minutes)
- Write **meaningful commit messages**
- Show your thought process through your commit history
- We want to see how you break down work

**Good commits:**

```
✅ "Add WebSocket connection with auto-reconnect"
✅ "Implement rolling average anomaly detection"
✅ "Optimize chart re-renders with useMemo"
```

**Bad commits:**

```
❌ "stuff"
❌ "fixed it"
❌ "final version"
```

---

## ⏱️ Time Management Suggestions

Here's one way to budget your 4 hours (but you decide!):

- **30 mins**: Project setup, explore provided data, plan approach
- **90 mins**: Core functionality (real-time display + basic visualization)
- **60 mins**: Anomaly detection algorithm
- **45 mins**: Polish, testing strategy, README
- **15 mins**: Buffer for debugging

**Key principle:** Ship something working, not something perfect.

---

## 🎓 What We're Evaluating

### 🔴 Critical (Must be strong here)

- **Does it work?** Can we run it and see real-time data?
- **Performance**: Does it handle continuous data without lagging?
- **Algorithm quality**: Is the anomaly detection thoughtful?
- **Code structure**: Is it readable and maintainable?
- **Communication**: Does your README explain your decisions?

### 🟡 Important (Good to have)

- **React best practices**: Proper hooks usage, performance optimization
- **TypeScript usage**: Meaningful types, not just annotations
- **Error handling**: Graceful failures and edge cases
- **Testing strategy**: Even if not fully implemented

### 🟢 Bonus Points

- **UI/UX polish**: Intuitive, clean interface
- **Accessibility**: Semantic HTML, keyboard navigation, screen reader support
- **DevOps**: Docker setup, hosted demo, CI/CD
- **Documentation**: Clear, concise, helpful

---

## 🤔 Things to Consider

You won't have time for everything, but think about these edge cases:

**Connection Issues:**

- What if the WebSocket connection drops?
- How do you handle reconnection?
- What happens to buffered data?

**Data Quality:**

- What if sensor data arrives out of order?
- What if a zone sends no data for 10 minutes?
- What if historical data is missing for certain periods?

**Performance:**

- How do you prevent memory leaks with continuous data?
- How do you keep the UI responsive while processing data?
- What's your strategy for handling thousands of data points?

**Anomaly Detection:**

- How do you avoid false positives?
- How do you handle zones with different patterns?
- Should night-time usage be treated differently?
- How do you detect gradual degradation vs sudden spikes?

---

## 💡 Anomaly Detection Hints

There's no single "right" answer. Here are some approaches to consider:

**Statistical Approaches:**

- Standard deviation from rolling mean
- Z-score calculation
- Moving average comparison

**Threshold-Based:**

- Static limits (exceeds X kW)
- Dynamic limits (based on zone configuration)
- Time-aware thresholds (different limits for day/night)

**Pattern-Based:**

- Spike detection (sudden changes)
- Trend analysis (gradual increases)
- Flatline detection (sensor failures)

**Comparative:**

- Compare to same time yesterday/last week
- Compare zone to zone (is one behaving differently?)

**Choose one approach and implement it well** rather than attempting several poorly. Document your reasoning!

---

## ✨ Success Looks Like

**During Assessment:**

- ✅ Dashboard displays real-time data smoothly
- ✅ Charts update efficiently without lag
- ✅ Anomaly detection catches obvious problems
- ✅ Code is clean and well-organized
- ✅ README honestly discusses trade-offs
- ✅ Git history shows your thinking process

**During Follow-Up Interview:**

- ✅ You can explain WHY you made specific choices
- ✅ You can extend your code with new features
- ✅ You understand the trade-offs in your implementation
- ✅ You can discuss how you'd improve with more time

---

## 🚫 Anti-Patterns We're Watching For

- ❌ **Over-engineering**: Don't build a production-ready enterprise system
- ❌ **Ignoring performance**: This is the key technical challenge
- ❌ **No testing strategy**: Even if not implemented, show you're thinking about it
- ❌ **Copy-paste without understanding**: We'll ask about your code in the interview
- ❌ **No trade-off discussion**: Everything has pros and cons
- ❌ **Perfect code with no personality**: Show us how YOU think

---

## 🎤 The Follow-Up Interview

After we review your submission, we'll schedule a 60-minute technical discussion:

### Live Coding (20 mins)

We'll ask you to add a new feature or modify existing functionality, such as:

- "Add a pause/resume button for the data stream"
- "Add a comparison view showing two zones side-by-side"
- "Implement export to CSV functionality"

### Deep Dive (20 mins)

- Walk us through your anomaly detection algorithm
- Explain specific performance optimizations you made
- Discuss trade-offs in your state management approach
- Debug a hypothetical issue we present

### Architecture Discussion (20 mins)

- How would you add user authentication?
- Design a notification system for critical alerts
- If users complained about "slow dashboard", where would you investigate?
- How would you make this work offline?
- Scaling to 100+ zones - what changes?

**The interview is just as important as the code submission.** We want to see that you understand your choices and can extend your work.

---

## 📮 Submission Instructions

1. **Create a GitHub repository** (public or private)
   - If private, invite: `[provide GitHub usernames]`
2. **Push your code** with frequent commits
3. **Ensure your README** has complete setup instructions
4. **Test that it works** - can someone else run it?
5. **Send us the repository link** to: `[email address]`

**Submission deadline:** `[Date and time]`

---

## ❓ Questions?

If anything is unclear:

- **Make reasonable assumptions** and document them in your README
- We want to see how you handle ambiguity
- There's no single "correct" solution

If you have technical questions about the setup:

- Email us at: `[contact email]`
- We'll respond within 24 hours

---

## 🙏 Final Notes

**We've done this test ourselves** - we know what's possible in 4 hours and what isn't. We're not expecting perfection.

**Be yourself** - we want to see how YOUR brain works. Don't try to guess what we want; show us what YOU think is important.

**Prioritize ruthlessly** - 4 hours goes fast. Focus on what matters most.

**Communicate clearly** - your README is just as important as your code. Explain your thinking!

**Have fun** - this is a chance to show off your skills and learn something new. We hope you enjoy the challenge!

---

## 🚀 Good luck!

We're excited to see what you build. Remember: **elegant and simple always wins over feature-rich and complex.**

If you have any questions, don't hesitate to reach out.

**The Ford Engineering Team**

---

## 📎 Attachments

- `mock-server.js` or `mock-server.py` - WebSocket server
- `historical-data.json` - 7 days of historical sensor data
- `zones-config.json` - Zone metadata and configuration
- `README-SETUP.md` - Detailed setup instructions

---

_This assessment is confidential. Please do not share the problem statement or your solution publicly._
