import SubscribeButton from './SubscribeButton';
import StockDashboard from './StockDashboard';

function App() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1>PulseTrade 🐂</h1>
      <p>NSE/BSE Technical Analysis Platform</p>

      <StockDashboard />

      <div style={{ marginTop: 30 }}>
        <SubscribeButton userEmail="" userName="" />
      </div>
    </div>
  )
}

export default App
