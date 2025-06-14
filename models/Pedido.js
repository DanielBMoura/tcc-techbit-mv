const db = require('../config/db')

const Pedido = db.sequelize.define('pedidos', {
    id_pedido: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    data_pedido: {
        type: db.Sequelize.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW
    },
    status_pedido: {
        type: db.Sequelize.ENUM('Aguardando Pagamento', 'Em separação', 'Aguardando envio', 'Enviado', 
            'Em rota de entrega', 'Entregue', 'Entrega não realizada', 'Devolvido', 'Cancelado'), // Se precisar, altere mais para ter mais possibilidades
        allowNull: false,
        defaultValue: 'Aguardando Pagamento'
    },
    numero_pedido: {
        type: db.Sequelize.INTEGER,
        allowNull: true,
        unique: true
    },
    valor_total_pedido: {
        type: db.Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    }
})

Pedido.afterCreate(async (pedido, options) => {
    await pedido.update({ numero_pedido: pedido.id_pedido })
})

module.exports = Pedido