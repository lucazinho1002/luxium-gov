import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Plugin customizado para simular a API do all.json dentro do Vite
function jsonApiPlugin() {
  const jsonPath = path.resolve(__dirname, 'actions/cidadaos/all.json');

  return {
    name: 'json-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Intercepta requisições para a rota /actions/cidadaos/all.json
        if (req.url === '/actions/cidadaos/all.json') {
          
          // --- ROTA GET: Ler cidadãos ---
          if (req.method === 'GET') {
            fs.readFile(jsonPath, 'utf8', (err, data) => {
              if (err) {
                res.statusCode = 500;
                return res.end(JSON.stringify({ error: 'Erro ao ler arquivo' }));
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(data || '[]');
            });
            return;
          }

          // --- ROTA POST: Adicionar novo cidadão ---
          if (req.method === 'POST') {
            let body = '';

            req.on('data', chunk => {
              body += chunk.toString();
            });

            req.on('end', () => {
              try {
                const { nome } = JSON.parse(body);

                if (!nome || !nome.trim()) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ error: 'Nome é obrigatório' }));
                }

                // Lê a lista atual
                fs.readFile(jsonPath, 'utf8', (err, data) => {
                  let cidadaos = [];
                  if (!err && data) {
                    try { cidadaos = JSON.parse(data); } catch (e) { cidadaos = []; }
                  }

                  // Adiciona o novo nome
                  cidadaos.push(nome.trim());

                  // Escreve de volta no all.json
                  fs.writeFile(jsonPath, JSON.stringify(cidadaos, null, 2), (err) => {
                    if (err) {
                      res.statusCode = 500;
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ error: 'Erro ao salvar' }));
                    }

                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, total: cidadaos.length, cidadaos }));
                  });
                });
              } catch (e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'JSON inválido' }));
              }
            });
            return;
          }
        }

        next();
      });
    }
  };
}

export default defineConfig({
  server: {
    host: '0.0.0.0', // Expõe para a rede
    port: 80,         // Porta 80
    strictPort: true,
  },
  plugins: [jsonApiPlugin()]
});