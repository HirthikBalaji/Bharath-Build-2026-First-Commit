import { app } from './app';
import apiRoutes from './routes/api.routes';

const PORT = process.env.PORT || 4000;

// Mount API routes
app.use('/api', apiRoutes);
app.use('/', apiRoutes); // Also expose at root for `/mock-operator/reissue`

app.listen(PORT, () => {
  console.log(`🚀 SeatRelay Backend server running on http://localhost:${PORT}`);
});
