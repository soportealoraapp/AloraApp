# Alora Multi-Region Architecture

## 🌍 Regions
1. **us-central1** (Primary): Authentication, Writes, Core Logic.
2. **europe-west1** (Secondary): Read-Replica for EU users.
3. **asia-northeast1** (Secondary): Read-Replica for APAC.

## 🔄 Failover Strategy
- **Traffic Director**: Cloud Load Balancer with proximity routing.
- **Database**: Firestore in Multi-Region Mode (nam5) for 99.999% SLA.

## ⚡ Latency Optimization
- **Edge Caching**: Firebase Hosting CDN caches static assets at the edge.
- **Dynamic Content**: Cloud Run instances deployed in each region.
