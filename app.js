/**
 * JDP INDUSTRIAL // SISTEMA JALHICA - MOTOR DE CONTAGEM E DADOS (app.js)
 * Arquitetura: Serverless / Real-time via URL e JSON
 * Arquiteto: José Divino Prado da Lapa
 * Chave Mestra: PRINCESA DIAMANTE
 */

const JALHICA_DATA_ENGINE = {
    // Array interno para armazenar cada transação em tempo de execução
    vendasBrutas: [],

    // 1. INICIALIZAÇÃO
    init: function() {
        this.carregarMemoria();
        this.atualizarInterfaceFront();
    },

    // 2. AÇÃO DO GARÇOM (Registra a URL enviada como 1 unidade vendida)
    registrarTransacao: function(urlFoto, nomeItem = 'Foto Selecionada', valorUnitario = 0) {
        if (!urlFoto) return;

        const novaVenda = {
            id_transacao: 'TX_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            url_foto: urlFoto,
            nome_item: nomeItem,
            valor: parseFloat(valorUnitario) || 0,
            timestamp: new Date().toISOString()
        };

        this.vendasBrutas.push(novaVenda);
        this.salvarMemoria();
        this.atualizarInterfaceFront();
        return novaVenda;
    },

    // 3. PERSISTÊNCIA EM MEMÓRIA LOCAL
    salvarMemoria: function() {
        localStorage.setItem('jalhica_vendas_brutas', JSON.stringify(this.vendasBrutas));
    },

    carregarMemoria: function() {
        const dadosSalvos = localStorage.getItem('jalhica_vendas_brutas');
        if (dadosSalvos) {
            try { this.vendasBrutas = JSON.parse(dadosSalvos); } catch (e) { this.vendasBrutas = []; }
        }
    },

    // 4. ATUALIZAÇÃO DO FRONT-END (Contador do Carrinho)
    atualizarInterfaceFront: function() {
        const elContador = document.getElementById('cart-count');
        if (elContador) {
            elContador.innerText = this.vendasBrutas.length;
        }
    },

    // 5. REMOÇÃO DE OCORRÊNCIA DA MEMÓRIA
    removerUrlEspecifica: function(urlFoto) {
        this.vendasBrutas = this.vendasBrutas.filter(item => item.url_foto !== urlFoto);
        this.salvarMemoria();
        this.atualizarInterfaceFront();
    },

    // 6. COMPILAÇÃO DO ARQUIVO DADOS.JSON (Sala de Máquinas)
    gerarDadosJSON: function() {
        const agrupamento = {};

        // Agrupa por URL e calcula a contagem exata (frequência)
        this.vendasBrutas.forEach(venda => {
            const url = venda.url_foto;
            if (!agrupamento[url]) {
                agrupamento[url] = {
                    url_imagem: url,
                    nome_produto: venda.nome_item,
                    quantidade_total: 0,
                    valor_unitario: venda.valor,
                    subtotal: 0
                };
            }
            agrupamento[url].quantidade_total += 1;
            agrupamento[url].subtotal = agrupamento[url].quantidade_total * agrupamento[url].valor_unitario;
        });

        const itensConsolidados = Object.values(agrupamento);
        const valorTotalGeral = itensConsolidados.reduce((acc, item) => acc + item.subtotal, 0);

        const estruturaDados = {
            protocolo: "JDP_INDUSTRIAL_DATA_v3.0",
            arquiteto: "JOSE DIVINO PRADO DA LAPA",
            chave_mestra: "PRINCESA DIAMANTE",
            data_geracao: new Date().toISOString(),
            resumo_vendas: {
                total_transacoes: this.vendasBrutas.length,
                total_itens_unicos: itensConsolidados.length,
                valor_total_acumulado: valorTotalGeral
            },
            itens_consolidados: itensConsolidados,
            historico_bruto: this.vendasBrutas
        };

        return JSON.stringify(estruturaDados, null, 2);
    },

    // 7. EXPORTAÇÃO FÍSICA PARA DOWNLOAD DE DADOS.JSON
    exportarArquivoDados: function(nomeArquivo = 'dados.json') {
        if (this.vendasBrutas.length === 0) {
            alert("Nenhum dado de venda computado até o momento!");
            return;
        }

        const jsonString = this.gerarDadosJSON();
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    // 8. INJEÇÃO E LEITURA DE DADOS EXTERNOS
    injetarDadosJSON: function(conteudoJSON) {
        try {
            const parsed = typeof conteudoJSON === 'string' ? JSON.parse(conteudoJSON) : conteudoJSON;
            
            if (parsed.historico_bruto && Array.isArray(parsed.historico_bruto)) {
                this.vendasBrutas = parsed.historico_bruto;
            } else if (parsed.itens_consolidados && Array.isArray(parsed.itens_consolidados)) {
                const reconstruido = [];
                parsed.itens_consolidados.forEach(item => {
                    for (let i = 0; i < (item.quantidade_total || 1); i++) {
                        reconstruido.push({
                            id_transacao: 'TX_INJECTED_' + Date.now(),
                            url_foto: item.url_imagem,
                            nome_item: item.nome_produto || 'Item Injetado',
                            valor: item.valor_unitario || 0,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
                this.vendasBrutas = reconstruido;
            }

            this.salvarMemoria();
            this.atualizarInterfaceFront();
            return true;
        } catch (e) {
            return false;
        }
    },

    // 9. LIMPEZA TOTAL DA MALHA DE DADOS
    zerarDados: function() {
        this.vendasBrutas = [];
        this.salvarMemoria();
        this.atualizarInterfaceFront();
    }
};

// Inicialização automática ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
    JALHICA_DATA_ENGINE.init();
});
