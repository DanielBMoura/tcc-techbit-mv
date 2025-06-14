// Models do Banco de Dados
    const Produto = require('../models/Produto')
    const ItensOrcamento = require('../models/ItensOrcamento')
    const Orcamento = require('../models/Orcamento')

// Op do sequelize
    const { Op } = require('sequelize')

async function limparOrcamentosAntigos() {
    const seteDiasAtras = new Date()

    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

    const orcamentosAntigos = await Orcamento.findAll({
        where: {
            status_orcamento: 'Em andamento',
            data_orcamento: {
                [Op.lt]: seteDiasAtras
            }
        },
        include: [{
            model: ItensOrcamento,
            as: 'itensorcamento', 
            include: [{
                model: Produto,
                as: 'produtos'
            }]
        }]
    })

    for(const orcamento of orcamentosAntigos) {
        await orcamento.update({ status_orcamento: 'Cancelado' })

        if (orcamento.itensorcamento  && orcamento.itensorcamento.length > 0) {
            for(const item of orcamento.itensorcamento) {
                if (item.produtos) {
                    const produto = item.produtos
                    const novaQuantidade = produto.estoque_produto + item.quantidade_itemOrcamento

                    await produto.update({ estoque_produto: novaQuantidade })

                    console.log(`Devolvido ${item.quantidade_itemOrcamento} unidades do produto ${produto.id_produto} ao estoque`)
                }
            }
        }

        console.log(`Orçamento ${orcamento.id_orcamento} cancelado e estoque atualizado`)
    }

    return {
        success: true,
        message: `${orcamentosAntigos.length} orçamentos cancelados`,
        orcamentosProcessados: orcamentosAntigos.length
    }
}

module.exports = { limparOrcamentosAntigos }