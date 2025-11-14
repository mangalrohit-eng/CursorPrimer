# 🤖 Presentation Coach Agent - Setup Guide

This is a **real LangGraph-based agentic AI system** that monitors presentation pace in real-time and provides intelligent coaching feedback.

## 🎯 What It Does

The agent uses LangGraph to create a multi-node workflow:
1. **Monitor Node**: Tracks timing and section progress
2. **Decide Node**: LLM-based decision making on whether coaching is needed
3. **Alert Node**: Sends intelligent feedback to the presenter

The agent uses **tools** for analysis and **state management** to maintain presentation context across decisions.

## 📋 Prerequisites

- Python 3.10+
- OpenAI API key
- Node.js (for optional testing)

## 🚀 Setup Instructions

### 1. Install Python Dependencies

```bash
# Install required packages
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-...
```

### 3. Start the Agent Backend

```bash
# Run the LangGraph agent server
python presentation_coach_agent.py
```

You should see:
```
🤖 Starting Presentation Coach Agent...
📊 LangGraph-based agentic AI system
🌐 WebSocket endpoint: ws://localhost:8000/ws/coach
```

### 4. Open the Website

```bash
# Open index.html in your browser
start index.html  # Windows
open index.html   # Mac
```

### 5. Start the Agent

1. Look for the **"AI Coach"** panel in the bottom-right corner
2. Click **"Start Coaching"**
3. Navigate through sections - the agent will monitor and provide feedback

## 🏗️ Architecture

### LangGraph Workflow

```
START
  ↓
[Monitor Node] ─→ Analyzes current section timing
  ↓
[Decide Node] ─→ LLM decides if coaching needed (uses tools)
  ↓
[Alert Node] ─→ Sends feedback via WebSocket
  ↓
END (or continue monitoring)
```

### Agent Tools

1. **analyze_pace**: Calculates timing variance and projects finish time
2. **generate_coaching_message**: Creates contextual feedback based on analysis

### State Management

The agent maintains:
- Start time
- Section times
- Coaching history
- Expected pace vs actual pace
- Alert status

## 🎨 Features

### Real-Time Monitoring
- Detects section changes automatically via Intersection Observer
- Sends timing data to LangGraph agent

### Intelligent Coaching
- **Too Slow**: Agent suggests condensing remaining sections
- **Too Fast**: Agent recommends elaborating or adding examples
- **On Track**: Agent confirms good pacing

### LLM-Based Decisions
- GPT-4 powered decision making
- Contextual understanding of presentation flow
- Adaptive messaging based on urgency

### Visual Feedback
- Animated modals with agent recommendations
- Color-coded alerts (red=slow, blue=fast, green=on track)
- Real-time status indicator

## 📊 Expected Pace

Default: **3 minutes per section** (24 minutes total for 8 sections)

You can adjust in `agent-frontend.js`:
```javascript
this.expectedPaceMinutes = 3; // Change this value
```

## 🧪 Testing

### Test the agent manually:

```bash
# In Python console
from presentation_coach_agent import agent_graph

state = {
    "messages": [],
    "start_time": time.time(),
    "current_section": 3,
    "section_times": [180, 240, 300],  # 3, 4, 5 minutes
    "total_sections": 8,
    "expected_pace": 3.0,
    "coaching_history": [],
    "should_alert": False,
    "alert_message": "",
    "alert_type": "on_track"
}

result = agent_graph.invoke(state)
print(result['alert_message'])
```

## 🔧 Customization

### Change Alert Thresholds

Edit `analyze_pace` tool in `presentation_coach_agent.py`:
```python
if abs(variance_percentage) < 15:  # Change threshold
    status = "on_track"
```

### Modify Coaching Messages

Edit `generate_coaching_message` tool messages dict.

### Add More Sections

Update in `agent-frontend.js`:
```javascript
this.totalSections = 10; // Increase number
```

## 🐛 Troubleshooting

### "Agent connection error"
- Check if Python backend is running (`python presentation_coach_agent.py`)
- Verify port 8000 is not in use
- Check browser console for WebSocket errors

### "Agent not providing feedback"
- Ensure you clicked "Start Coaching"
- Navigate between sections (scroll or click nav links)
- Check Python console for agent logs

### OpenAI API errors
- Verify API key in `.env` file
- Check API quota/billing
- Ensure internet connection

## 📝 What Makes This "Agentic"?

1. **Autonomous Decision Making**: The LLM decides whether coaching is needed
2. **Tool Use**: Agent calls tools to analyze data and generate responses
3. **State Management**: Maintains context across multiple interactions
4. **Multi-Node Workflow**: Complex decision flow with conditional routing
5. **Real-Time Adaptation**: Adjusts feedback based on presentation progress

## 🎓 Learning Resources

- [LangGraph Documentation](https://python.langchain.com/docs/langgraph)
- [Building Agents with LangGraph](https://blog.langchain.dev/langgraph-multi-agent-workflows/)
- [Agent Tools](https://python.langchain.com/docs/modules/agents/tools/)

## 📄 License

This is a demonstration project showcasing LangGraph capabilities.


