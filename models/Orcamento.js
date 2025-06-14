const db = require('../config/db')

const Orcamento = db.sequelize.define('orcamentos', {
    id_orcamento: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    data_orcamento: {
        type: db.Sequelize.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW
    },
    status_orcamento: {
        type: db.Sequelize.ENUM('Em andamento', 'Aguardando resposta do Administrador', 'Aguardando resposta do cliente', 'Fechado', 'Cancelado'), // Se precisar, altere mais para ter mais possibilidades
        allowNull: false,
        defaultValue: 'Em andamento'
    },
    numero_orcamento: {
        type: db.Sequelize.INTEGER,
        allowNull: true,
        unique: true
    }
})

// Ver se pode tirar dps
// Orcamento.afterCreate(async (orcamento) => {
//     orcamento.numero_pedido = orcamento.id_orcamento
//     await orcamento.save()
// })

module.exports = Orcamento