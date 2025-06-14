const db = require('../config/db')

const SubCategoria = db.sequelize.define('subCategorias', {
    id_subCategoria: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome_subCategoria: {
        type: db.Sequelize.STRING(150),
        allowNull: false
    },
    slug_subCategoria: {
        type: db.Sequelize.STRING(255),
        allowNull: false
    },
    imagem_subCategoria: {
        type: db.Sequelize.STRING(255),
        allowNull: false,
        unique: true
    }
})

module.exports = SubCategoria