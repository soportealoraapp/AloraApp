# Alora Monitoring Dashboard (Cloud Monitoring)

## 📊 Overview
- **Uptime**: 99.9% Target.
- **Error Rate**: < 0.1%.
- **Latency (p95)**: < 200ms API, < 1000ms Web.

## 📈 Widgets
1. **Active Users (Real-time)**: WebSocket connections.
2. **API Latency Heatmap**: Breakdown by endpoint.
3. **Firestore Writes/Sec**: Cost monitoring.
4. **Android Vitals**: Crash-free sessions (from Play Console).

## 🚨 Alert Policies
- **High Error Rate**: > 5% / 5min -> PagerDuty.
- **Latency Spike**: > 2s / 5min -> Slack.
