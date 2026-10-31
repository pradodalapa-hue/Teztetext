/**
 * JDP INDUSTRIAL // JALHICA ENGINE v9.0 SUPREME
 * Arquiteto: José Divino Prado da Lapa
 * Chave Mestra: PRINCESA DIAMANTE
 * Função: Trabalhador autônomo de dados e sinapses (Girabase Realtime)
 */

const JALHICA_ENGINE = {
    urls: {
        cerebro: "https://pradodalapa-hue.github.io/Teztetext/cerebro.json",
        dados: "https://pradodalapa-hue.github.io/Teztetext/dados.json"
    },
    
    vendasBrutas: [],
    cognitiveLibrary: [],

    // 1. INICIALIZAÇÃO DA CASA
    init: function() {
        this.carregarLocal();
        this.iniciarRealtimeWorker();
        this.atualizarInterface();
    },

    // 2. O TRABALHADOR SAI PRA RUA (Registra a foto/venda enviada pelo Garçom)
    registrarVenda: function(urlFoto, nomeItem = 'Item Selecionado', valor = 0) {
        if (!urlFoto) return;

        const transacao = {
            id: 'TX_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            url_foto: urlFoto,
            nome: nomeItem,
            valor: parseFloat(valor) || 0,
            timestamp: new Date().toISOString()
        };

        this.vendasBrutas.push(transacao);
        this.salvarLocal();
        this.atualizarInterface();
        return transacao;
    },

    // 3. RETORNO PARA A CASA (Persistência no localStorage)
    salvarLocal: function() {
        localStorage.setItem('jdp_vendas_log', JSON.stringify(this.vendasBrutas));
        localStorage.setItem('jalhica_neural_cerebro', JSON.stringify(this.cognitiveLibrary));
    },

    carregarLocal: function() {
        const d = localStorage.getItem('jdp_vendas_log');
        const c = localStorage.getItem('jalhica_neural_cerebro');
        if (d) try { this.vendasBrutas = JSON.parse(d); } catch(e) { this.vendasBrutas = []; }
        if (c) try { this.cognitiveLibrary = JSON.parse(c); } catch(e) { this.cognitiveLibrary = []; }
    },

    // 4. ATUALIZAÇÃO DO FRONT-END
    atualizarInterface: function() {
        const elCount = document.getElementById('cart-count');
        if (elCount) elCount.innerText = this.vendasBrutas.length;

        const elSinapses = document.getElementById('val-sinapses');
        if (elSinapses) {
            let totalTokens = 0;
            this.cognitiveLibrary.forEach(item => totalTokens += (item.neuronios ? item.neuronios.length : 0));
            elSinapses.innerText = `Sinapses Ativas: ${this.cognitiveLibrary.length} (${totalTokens} neurônios)`;
        }
    },

    // 5. MOTOR REALTIME (Puxa as atualizações das URLs do GitHub sem travar cache)
    iniciarRealtimeWorker: function() {
        const sincronizar = async () => {
            try {
                // Puxa cerebro.json
                const resCerebro = await fetch(`${this.urls.cerebro}?t=${Date.now()}`);
                if (resCerebro.ok) {
                    const jsonCerebro = await resCerebro.json();
                    if (jsonCerebro.malha_neuronal) {
                        this.cognitiveLibrary = jsonCerebro.malha_neuronal;
                    }
                }
                // Puxa dados.json
                const resDados = await fetch(`${this.urls.dados}?t=${Date.now()}`);
                if (resDados.ok) {
                    const jsonDados = await resDados.json();
                    if (jsonDados.historico_bruto) {
                        this.vendasBrutas = jsonDados.historico_bruto;
                    }
                }
                this.salvarLocal();
                this.atualizarInterface();
            } catch (err) {
                console.log("[JALHICA WORKER] Modo offline ou aguardando sincronização.");
            }
        };

        sincronizar();
        setInterval(sincronizar, 10000); // Polling a cada 10 segundos
    },

    // 6. COMPILAÇÃO E ESCRITA DO DADOS.JSON (Sala de Máquinas)
    gerarDadosJSON: function() {
        const agrupamento = {};
        this.vendasBrutas.forEach(v => {
            const url = v.url_foto;
            if (!agrupamento[url]) {
                agrupamento[url] = { url_imagem: url, nome: v.nome, quantidade_total: 0, valor_unitario: v.valor };
            }
            agrupamento[url].quantidade_total += 1;
        });

        return JSON.stringify({
            protocolo: "JDP_INDUSTRIAL_DATA_v9.0",
            arquiteto: "JOSE DIVINO PRADO DA LAPA",
            chave_mestra: "PRINCESA DIAMANTE",
            resumo: { total_transacoes: this.vendasBrutas.length, total_itens_unicos: Object.keys(agrupamento).length },
            itens_consolidados: Object.values(agrupamento),
            historico_bruto: this.vendasBrutas
        }, null, 2);
    },

    exportarDados: function(nomeArquivo = 'dados.json') {
        const blob = new Blob([this.gerarDadosJSON()], { type: "application/json" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nomeArquivo;
        a.click();
    }
};

// Dispara o motor quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => JALHICA_ENGINE.init());
