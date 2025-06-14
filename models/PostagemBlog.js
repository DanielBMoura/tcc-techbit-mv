const db = require('../config/db')

const PostagemBlog = db.sequelize.define('postagensBlog', {
    id_postagemBlog: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    titulo_postagemBlog: {
        type: db.Sequelize.STRING(255),
        allowNull: false
    },
    slug_postagemBlog: {
        type: db.Sequelize.STRING(255),
        allowNull: false
    },
    descricao_postagemBlog: {
        type: db.Sequelize.TEXT,
        allowNull: false
    },
    conteudo_postagemBlog: {
        type: db.Sequelize.TEXT,
        allowNull: false 
    },
    data_postagemBlog: {
        type: db.Sequelize.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW
    }
})

module.exports = PostagemBlog