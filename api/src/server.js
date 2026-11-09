import { config } from './config.js';
import { connect } from './db.js';
import { createServer } from './app.js';

async function connectWithRetry(attempts = 20) {
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await connect(config.mongoUrl, config.dbName);
    } catch (err) {
      if (i === attempts) throw err;
      console.log(`MongoDB indisponível (tentativa ${i}/${attempts}), aguardando...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

await connectWithRetry();
const { server } = createServer();
server.listen(config.port, () => console.log(`API ouvindo na porta ${config.port}`));
