const db = require('../config/db')

const Categoria = db.sequelize.define('categorias', {
    id_categoria: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome_categoria: {
        type: db.Sequelize.STRING(150),
        allowNull: false,
        unique: true
    },
    slug_categoria: {
        type: db.Sequelize.STRING(255),
        allowNull: false,
        unique: true
    },
    imagem_categoria: {
        type: db.Sequelize.STRING(255),
        allowNull: false,
        unique: true
    }
})

module.exports = Categoria